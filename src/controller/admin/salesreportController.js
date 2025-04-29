const Order = require("../../models/orderSchema");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");
const moment = require("moment");

// Get Sales Report
const getSalesReport = async (req, res) => {
  try {
    const reportType = req.query.type || "daily";
    let startDate, endDate;

    if (reportType === "custom" && req.query.startDate && req.query.endDate) {
      startDate = moment(req.query.startDate).startOf("day").toDate();
      endDate = moment(req.query.endDate).endOf("day").toDate();
    } else {
      switch (reportType) {
        case "daily":
          startDate = moment().startOf("day").toDate();
          endDate = moment().endOf("day").toDate();
          break;
        case "weekly":
          startDate = moment().startOf("week").toDate();
          endDate = moment().endOf("week").toDate();
          break;
        case "monthly":
          startDate = moment().startOf("month").toDate();
          endDate = moment().endOf("month").toDate();
          break;
        case "yearly":
          startDate = moment().startOf("year").toDate();
          endDate = moment().endOf("year").toDate();
          break;
        default:
          startDate = moment().startOf("day").toDate();
          endDate = moment().endOf("day").toDate();
      }
    }

    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate },
      orderStatus: { $nin: ["Cancelled", "Returned"] },
    })
    .populate("userId", "username")
    .sort({ createdAt: -1 });

    const overallStats = {
      salesCount: orders.length,
      totalOrderAmount: orders.reduce(
        (sum, order) => sum + order.orderAmount,
        0
      ),
      totalDiscounts: orders.reduce(
        (sum, order) => sum + (order.couponDiscount || 0),
        0
      ),
      netSales: orders.reduce(
        (sum, order) => sum + (order.orderAmount - (order.couponDiscount || 0)),
        0
      ),
    };

    res.render("salesreport", {
      orders,
      reportType,
      startDate: moment(startDate).format("YYYY-MM-DD"),
      endDate: moment(endDate).format("YYYY-MM-DD"),
      overallStats,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

// Download PDF Report
const downloadPDF = async (req, res) => {
  try {
    const reportType = req.query.type || "daily";
    let startDate, endDate;

    if (reportType === "custom" && req.query.startDate && req.query.endDate) {
      startDate = moment(req.query.startDate).startOf("day").toDate();
      endDate = moment(req.query.endDate).endOf("day").toDate();
    } else {
      switch (reportType) {
        case "daily":
          startDate = moment().startOf("day").toDate();
          endDate = moment().endOf("day").toDate();
          break;
        case "weekly":
          startDate = moment().startOf("week").toDate();
          endDate = moment().endOf("week").toDate();
          break;
        case "monthly":
          startDate = moment().startOf("month").toDate();
          endDate = moment().endOf("month").toDate();
          break;
        case "yearly":
          startDate = moment().startOf("year").toDate();
          endDate = moment().endOf("year").toDate();
          break;
        default:
          startDate = moment().startOf("day").toDate();
          endDate = moment().endOf("day").toDate();
      }
    }

    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate },
      orderStatus: { $ne: "Cancelled" },
    }).populate("userId");

    const overallStats = {
      salesCount: orders.length,
      totalOrderAmount: orders.reduce(
        (sum, order) => sum + order.orderAmount,
        0
      ),
      totalDiscounts: orders.reduce(
        (sum, order) => sum + (order.couponDiscount || 0),
        0
      ),
      netSales: orders.reduce(
        (sum, order) => sum + (order.orderAmount - (order.couponDiscount || 0)),
        0
      ),
    };

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=sales-report-${reportType}.pdf`
    );

    doc.pipe(res);

    doc
      .fontSize(20)
      .text(
        `Sales Report - ${
          reportType.charAt(0).toUpperCase() + reportType.slice(1)
        }`,
        { align: "center" }
      );
    doc.moveDown();
    doc.fontSize(12).text(`From: ${moment(startDate).format("DD-MM-YYYY")}`);
    doc.text(`To: ${moment(endDate).format("DD-MM-YYYY")}`);
    doc.moveDown();

    doc.fontSize(14).text("Summary:", { underline: true });
    doc.fontSize(12).text(`Total Orders: ${overallStats.salesCount}`);
    doc.text(
      `Total Order Amount: ₹${overallStats.totalOrderAmount.toFixed(2)}`
    );
    doc.text(`Total Discounts: ₹${overallStats.totalDiscounts.toFixed(2)}`);
    doc.text(`Net Sales: ₹${overallStats.netSales.toFixed(2)}`);
    doc.moveDown(2);

    // Orders table
    doc.fontSize(14).text("Orders:", { underline: true });
    doc.moveDown();

    // Define table layout
    const tableTop = doc.y;
    const tableLeft = 50;
    const colWidths = [80, 70, 80, 60, 70, 60, 70];
    const rowHeight = 20;

    // Draw table headers
    const headers = [
      "Order No.",
      "Date",
      "Customer",
      "Amount (₹)",
      "Discount (₹)",
      "Final (₹)",
      "Status",
    ];
    doc.fontSize(10);

    // Draw header background
    doc
      .fillColor("#f0f0f0")
      .rect(
        tableLeft,
        tableTop,
        colWidths.reduce((a, b) => a + b, 0),
        rowHeight
      )
      .fill();
    doc.fillColor("#000000");

    // Draw header text
    headers.forEach((header, i) => {
      let xPos = tableLeft;
      for (let j = 0; j < i; j++) {
        xPos += colWidths[j];
      }
      doc.text(header, xPos + 5, tableTop + 5, {
        width: colWidths[i] - 10,
        align: "left",
      });
    });

    // Draw table rows
    let currentY = tableTop + rowHeight;

    orders.forEach((order, index) => {
      const finalAmount = order.orderAmount - (order.couponDiscount || 0);
      const rowData = [
        order.orderNumber,
        moment(order.createdAt).format("DD-MM-YYYY"),
        order.userId ? order.userId.username : "Guest",
        order.orderAmount.toFixed(2),
        (order.couponDiscount || 0).toFixed(2),
        finalAmount.toFixed(2),
        order.orderStatus,
      ];

      if (currentY + rowHeight > doc.page.height - 50) {
        doc.addPage();
        currentY = 50;

        doc
          .fillColor("#f0f0f0")
          .rect(
            tableLeft,
            currentY,
            colWidths.reduce((a, b) => a + b, 0),
            rowHeight
          )
          .fill();
        doc.fillColor("#000000");

        headers.forEach((header, i) => {
          let xPos = tableLeft;
          for (let j = 0; j < i; j++) {
            xPos += colWidths[j];
          }
          doc.text(header, xPos + 5, currentY + 5, {
            width: colWidths[i] - 10,
            align: "left",
          });
        });

        currentY += rowHeight;
      }

      doc
        .fillColor(index % 2 === 0 ? "#ffffff" : "#f9f9f9")
        .rect(
          tableLeft,
          currentY,
          colWidths.reduce((a, b) => a + b, 0),
          rowHeight
        )
        .fill();
      doc.fillColor("#000000");

      // Draw cell borders
      doc.lineWidth(0.5);

      // Horizontal lines
      doc
        .moveTo(tableLeft, currentY)
        .lineTo(tableLeft + colWidths.reduce((a, b) => a + b, 0), currentY)
        .stroke();

      // Draw row data
      rowData.forEach((cell, i) => {
        let xPos = tableLeft;
        for (let j = 0; j < i; j++) {
          xPos += colWidths[j];
        }

        // Draw vertical lines
        doc
          .moveTo(xPos, currentY)
          .lineTo(xPos, currentY + rowHeight)
          .stroke();

        // Draw text
        doc.text(cell, xPos + 5, currentY + 5, {
          width: colWidths[i] - 10,
          align: "left",
        });
      });

      // Draw last vertical line
      let lastX = tableLeft;
      for (let i = 0; i < colWidths.length; i++) {
        lastX += colWidths[i];
      }
      doc
        .moveTo(lastX, currentY)
        .lineTo(lastX, currentY + rowHeight)
        .stroke();

      currentY += rowHeight;

      // Bottom line for the last row
      if (index === orders.length - 1) {
        doc
          .moveTo(tableLeft, currentY)
          .lineTo(tableLeft + colWidths.reduce((a, b) => a + b, 0), currentY)
          .stroke();
      }
    });

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

// Download Excel Report
const downloadExcel = async (req, res) => {
  try {
    const reportType = req.query.type || "daily";
    let startDate, endDate;

    if (reportType === "custom" && req.query.startDate && req.query.endDate) {
      startDate = moment(req.query.startDate).startOf("day").toDate();
      endDate = moment(req.query.endDate).endOf("day").toDate();
    } else {
      switch (reportType) {
        case "daily":
          startDate = moment().startOf("day").toDate();
          endDate = moment().endOf("day").toDate();
          break;
        case "weekly":
          startDate = moment().startOf("week").toDate();
          endDate = moment().endOf("week").toDate();
          break;
        case "monthly":
          startDate = moment().startOf("month").toDate();
          endDate = moment().endOf("month").toDate();
          break;
        case "yearly":
          startDate = moment().startOf("year").toDate();
          endDate = moment().endOf("year").toDate();
          break;
        default:
          startDate = moment().startOf("day").toDate();
          endDate = moment().endOf("day").toDate();
      }
    }

    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate },
      orderStatus: { $ne: "Cancelled" },
    }).populate("userId");

    const overallStats = {
      salesCount: orders.length,
      totalOrderAmount: orders.reduce(
        (sum, order) => sum + order.orderAmount,
        0
      ),
      totalDiscounts: orders.reduce(
        (sum, order) => sum + (order.couponDiscount || 0),
        0
      ),
      netSales: orders.reduce(
        (sum, order) => sum + (order.orderAmount - (order.couponDiscount || 0)),
        0
      ),
    };

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sales Report");

    worksheet.addRow([
      `Sales Report - ${
        reportType.charAt(0).toUpperCase() + reportType.slice(1)
      }`,
    ]);
    worksheet.addRow([
      `From: ${moment(startDate).format("DD-MM-YYYY")}`,
      `To: ${moment(endDate).format("DD-MM-YYYY")}`,
    ]);
    worksheet.addRow([]);

    worksheet.addRow(["Summary"]);
    worksheet.addRow(["Total Orders", overallStats.salesCount]);
    worksheet.addRow([
      "Total Order Amount",
      overallStats.totalOrderAmount.toFixed(2),
    ]);
    worksheet.addRow([
      "Total Discounts",
      overallStats.totalDiscounts.toFixed(2),
    ]);
    worksheet.addRow(["Net Sales", overallStats.netSales.toFixed(2)]);
    worksheet.addRow([]);

    worksheet.addRow(["Order Details"]);
    worksheet.addRow([]);

    // Add column headers
    worksheet.columns = [
      { header: "Order Number", key: "orderNumber", width: 20 },
      { header: "Date", key: "date", width: 15 },
      { header: "Customer", key: "customer", width: 20 },
      { header: "Total Amount", key: "totalAmount", width: 15 },
      { header: "Coupon Code", key: "couponCode", width: 15 },
      { header: "Coupon Discount", key: "couponDiscount", width: 15 },
      { header: "Final Amount", key: "finalAmount", width: 15 },
      { header: "Payment Method", key: "paymentMethod", width: 15 },
      { header: "Status", key: "status", width: 15 },
    ];

    // Add order data
    orders.forEach((order) => {
      const finalAmount = order.orderAmount - (order.couponDiscount || 0);
      worksheet.addRow({
        orderNumber: order.orderNumber,
        date: moment(order.createdAt).format("DD-MM-YYYY"),
        customer: order.userId ? order.userId.userCname : "Guest",
        totalAmount: order.orderAmount.toFixed(2),
        couponCode: order.couponCode || "N/A",
        couponDiscount: (order.couponDiscount || 0).toFixed(2),
        finalAmount: finalAmount.toFixed(2),
        paymentMethod: order.paymentMethod,
        status: order.orderStatus,
      });
    });

    // Apply some styling
    worksheet.getRow(1).font = { bold: true, size: 16 };
    worksheet.getRow(4).font = { bold: true };
    worksheet.getRow(10).font = { bold: true };

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=sales-report-${reportType}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

module.exports = {
  getSalesReport,
  downloadPDF,
  downloadExcel,
};
