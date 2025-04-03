const Wallet = require('../../models/walletSchema');
const User = require('../../models/userSchema');

const getWalletTransactions = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 10; // Number of transactions per page
      
      const searchQuery = req.query.query || '';
      let query = {};
      
      // If there's a search query, find users matching the query first
      if (searchQuery) {
        const users = await User.find({
          $or: [
            { name: { $regex: searchQuery, $options: 'i' } },
            { email: { $regex: searchQuery, $options: 'i' } }
          ]
        });
        
        const userIds = users.map(user => user._id);
        query = { userId: { $in: userIds } };
      }
      
      // Aggregate to get all transactions from all matching wallets
      const wallets = await Wallet.find(query).populate('userId', 'name email');
      
      // Flatten the transactions from all wallets
      let allTransactions = [];
      for (const wallet of wallets) {
        if (wallet.transaction && wallet.transaction.length > 0) {
          const userTransactions = wallet.transaction.map(t => ({
            _id: t._id,
            amount: t.amount,
            transactionsMethod: t.transactionsMethod,
            date: t.date,
            orderId: t.orderId,
            userName: wallet.userId.name,
            userEmail: wallet.userId.email,
            walletBalance: wallet.balance
          }));
          allTransactions = [...allTransactions, ...userTransactions];
        }
      }
      
      // Sort transactions by date (newest first)
      allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      // Calculate total pages based on transactions count
      const totalTransactions = allTransactions.length;
      const totalPages = Math.ceil(totalTransactions / limit);
      
      // Apply pagination to the flattened and sorted transactions
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedTransactions = allTransactions.slice(startIndex, endIndex);
      
      // Generate pagination links
      let pages = [];
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      
      // If there are many pages, limit the displayed page numbers
      if (pages.length > 5) {
        if (page <= 3) {
          pages = [...pages.slice(0, 5), '...', totalPages];
        } else if (page >= totalPages - 2) {
          pages = [1, '...', ...pages.slice(totalPages - 5)];
        } else {
          pages = [1, '...', page - 1, page, page + 1, '...', totalPages];
        }
      }
      
      res.render('walletmanagement', {
        transactions: paginatedTransactions,
        pagination: {
          currentPage: page,
          totalPages: totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        pages: pages,
        searchQuery: searchQuery,
        startIndex: startIndex
      });
      
    } catch (error) {
      console.error('Error fetching wallet transactions:', error);
      res.render('walletmanagement', { 
        transactions: [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false
        },
        pages: [1],
        searchQuery: '',
        startIndex: 0,
        error: 'Failed to load wallet transactions'
      });
    }
  }

module.exports = {
    getWalletTransactions
}