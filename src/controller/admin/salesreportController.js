const Order = require('../../models/orderSchema');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const moment = require('moment');

// Get Sales Report
const getSalesReport = async (req, res) => {
    try {
        const reportType = req.query.type || 'daily';
        let startDate, endDate;

        // Handle custom date range
        if (reportType === 'custom' && req.query.startDate && req.query.endDate) {
            startDate = moment(req.query.startDate).startOf('day').toDate();
            endDate = moment(req.query.endDate).endOf('day').toDate();
        } else {
            switch (reportType) {
                case 'daily':
                    startDate = moment().startOf('day').toDate();
                    endDate = moment().endOf('day').toDate();
                    break;
                case 'weekly':
                    startDate = moment().startOf('week').toDate();
                    endDate = moment().endOf('week').toDate();
                    break;
                case 'monthly':
                    startDate = moment().startOf('month').toDate();
                    endDate = moment().endOf('month').toDate();
                    break;
                case 'yearly':
                    startDate = moment().startOf('year').toDate();
                    endDate = moment().endOf('year').toDate();
                    break;
                default:
                    startDate = moment().startOf('day').toDate();
                    endDate = moment().endOf('day').toDate();
            }
        }

        const orders = await Order.find({
            createdAt: { $gte: startDate, $lte: endDate },
            orderStatus: { $ne: 'Cancelled' }
        }).populate('userId');

        // Calculate overall statistics
        const overallStats = {
            salesCount: orders.length,
            totalOrderAmount: orders.reduce((sum, order) => sum + order.orderAmount, 0),
            totalDiscounts: orders.reduce((sum, order) => sum + (order.couponDiscount || 0), 0),
            netSales: orders.reduce((sum, order) => sum + (order.orderAmount - (order.couponDiscount || 0)), 0)
        };

        res.render('salesreport', { 
            orders, 
            reportType, 
            startDate: moment(startDate).format('YYYY-MM-DD'), 
            endDate: moment(endDate).format('YYYY-MM-DD'),
            overallStats
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

// Download PDF Report
const downloadPDF = async (req, res) => {
    try {
        const reportType = req.query.type || 'daily';
        let startDate, endDate;

        // Handle custom date range
        if (reportType === 'custom' && req.query.startDate && req.query.endDate) {
            startDate = moment(req.query.startDate).startOf('day').toDate();
            endDate = moment(req.query.endDate).endOf('day').toDate();
        } else {
            switch (reportType) {
                case 'daily':
                    startDate = moment().startOf('day').toDate();
                    endDate = moment().endOf('day').toDate();
                    break;
                case 'weekly':
                    startDate = moment().startOf('week').toDate();
                    endDate = moment().endOf('week').toDate();
                    break;
                case 'monthly':
                    startDate = moment().startOf('month').toDate();
                    endDate = moment().endOf('month').toDate();
                    break;
                case 'yearly':
                    startDate = moment().startOf('year').toDate();
                    endDate = moment().endOf('year').toDate();
                    break;
                default:
                    startDate = moment().startOf('day').toDate();
                    endDate = moment().endOf('day').toDate();
            }
        }

        const orders = await Order.find({
            createdAt: { $gte: startDate, $lte: endDate },
            orderStatus: { $ne: 'Cancelled' }
        }).populate('userId');

        // Calculate overall statistics
        const overallStats = {
            salesCount: orders.length,
            totalOrderAmount: orders.reduce((sum, order) => sum + order.orderAmount, 0),
            totalDiscounts: orders.reduce((sum, order) => sum + (order.couponDiscount || 0), 0),
            netSales: orders.reduce((sum, order) => sum + (order.orderAmount - (order.couponDiscount || 0)), 0)
        };

        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=sales-report-${reportType}.pdf`);

        doc.pipe(res);

        // Title and date range
        doc.fontSize(20).text(`Sales Report - ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}`, { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`From: ${moment(startDate).format('DD-MM-YYYY')}`);
        doc.text(`To: ${moment(endDate).format('DD-MM-YYYY')}`);
        doc.moveDown();

        // Overall statistics
        doc.fontSize(14).text('Summary:', { underline: true });
        doc.fontSize(12).text(`Total Orders: ${overallStats.salesCount}`);
        doc.text(`Total Order Amount: ₹${overallStats.totalOrderAmount.toFixed(2)}`);
        doc.text(`Total Discounts: ₹${overallStats.totalDiscounts.toFixed(2)}`);
        doc.text(`Net Sales: ₹${overallStats.netSales.toFixed(2)}`);
        doc.moveDown(2);

        // Orders list
        doc.fontSize(14).text('Orders:', { underline: true });
        doc.moveDown();

        orders.forEach((order, index) => {
            const finalAmount = order.orderAmount - (order.couponDiscount || 0);
            doc.fontSize(12).text(`Order ${index + 1}:`);
            doc.text(`Order Number: ${order.orderNumber}`);
            doc.text(`Date: ${moment(order.createdAt).format('DD-MM-YYYY')}`);
            doc.text(`Customer: ${order.userId ? order.userId.name : 'Guest'}`);
            doc.text(`Total Amount: ₹${order.orderAmount.toFixed(2)}`);
            doc.text(`Coupon: ${order.couponCode || 'N/A'}`);
            doc.text(`Coupon Discount: ₹${(order.couponDiscount || 0).toFixed(2)}`);
            doc.text(`Final Amount: ₹${finalAmount.toFixed(2)}`);
            doc.text(`Status: ${order.orderStatus}`);
            doc.moveDown();
        });

        doc.end();
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

// Download Excel Report
const downloadExcel = async (req, res) => {
    try {
        const reportType = req.query.type || 'daily';
        let startDate, endDate;

        // Handle custom date range
        if (reportType === 'custom' && req.query.startDate && req.query.endDate) {
            startDate = moment(req.query.startDate).startOf('day').toDate();
            endDate = moment(req.query.endDate).endOf('day').toDate();
        } else {
            switch (reportType) {
                case 'daily':
                    startDate = moment().startOf('day').toDate();
                    endDate = moment().endOf('day').toDate();
                    break;
                case 'weekly':
                    startDate = moment().startOf('week').toDate();
                    endDate = moment().endOf('week').toDate();
                    break;
                case 'monthly':
                    startDate = moment().startOf('month').toDate();
                    endDate = moment().endOf('month').toDate();
                    break;
                case 'yearly':
                    startDate = moment().startOf('year').toDate();
                    endDate = moment().endOf('year').toDate();
                    break;
                default:
                    startDate = moment().startOf('day').toDate();
                    endDate = moment().endOf('day').toDate();
            }
        }

        const orders = await Order.find({
            createdAt: { $gte: startDate, $lte: endDate },
            orderStatus: { $ne: 'Cancelled' }
        }).populate('userId');

        // Calculate overall statistics
        const overallStats = {
            salesCount: orders.length,
            totalOrderAmount: orders.reduce((sum, order) => sum + order.orderAmount, 0),
            totalDiscounts: orders.reduce((sum, order) => sum + (order.couponDiscount || 0), 0),
            netSales: orders.reduce((sum, order) => sum + (order.orderAmount - (order.couponDiscount || 0)), 0)
        };

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sales Report');

        // Add title and date range
        worksheet.addRow([`Sales Report - ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}`]);
        worksheet.addRow([`From: ${moment(startDate).format('DD-MM-YYYY')}`, `To: ${moment(endDate).format('DD-MM-YYYY')}`]);
        worksheet.addRow([]);

        // Add summary section
        worksheet.addRow(['Summary']);
        worksheet.addRow(['Total Orders', overallStats.salesCount]);
        worksheet.addRow(['Total Order Amount', overallStats.totalOrderAmount.toFixed(2)]);
        worksheet.addRow(['Total Discounts', overallStats.totalDiscounts.toFixed(2)]);
        worksheet.addRow(['Net Sales', overallStats.netSales.toFixed(2)]);
        worksheet.addRow([]);

        // Add orders table
        worksheet.addRow(['Order Details']);
        worksheet.addRow([]);
        
        // Add column headers
        worksheet.columns = [
            { header: 'Order Number', key: 'orderNumber', width: 20 },
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Customer', key: 'customer', width: 20 },
            { header: 'Total Amount', key: 'totalAmount', width: 15 },
            { header: 'Coupon Code', key: 'couponCode', width: 15 },
            { header: 'Coupon Discount', key: 'couponDiscount', width: 15 },
            { header: 'Final Amount', key: 'finalAmount', width: 15 },
            { header: 'Payment Method', key: 'paymentMethod', width: 15 },
            { header: 'Status', key: 'status', width: 15 }
        ];

        // Add order data
        orders.forEach(order => {
            const finalAmount = order.orderAmount - (order.couponDiscount || 0);
            worksheet.addRow({
                orderNumber: order.orderNumber,
                date: moment(order.createdAt).format('DD-MM-YYYY'),
                customer: order.userId ? order.userId.name : 'Guest',
                totalAmount: order.orderAmount.toFixed(2),
                couponCode: order.couponCode || 'N/A',
                couponDiscount: (order.couponDiscount || 0).toFixed(2),
                finalAmount: finalAmount.toFixed(2),
                paymentMethod: order.paymentMethod,
                status: order.orderStatus
            });
        });

        // Apply some styling
        worksheet.getRow(1).font = { bold: true, size: 16 };
        worksheet.getRow(4).font = { bold: true };
        worksheet.getRow(10).font = { bold: true };

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=sales-report-${reportType}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

module.exports = {
    getSalesReport,
    downloadPDF,
    downloadExcel
};