const express = require("express");
const sql = require("mssql");
const nodemailer = require("nodemailer");
const dayjs = require("dayjs");

const app = express();
const port = 3000;

// MSSQL Configuration
const sqlConfig = {
    user: "newuser",
    password: "admin1234",
    database: "data2",
    server: 'HARSHIT', // You can use 'localhost\\instance' to connect to named instance
    options: {
        encrypt: true,
        trustServerCertificate: true,
    },
};

// Email Configuration
const transporter = nodemailer.createTransport({
        service: "Gmail",
        host: "smtp.gmail.com",
        port: 587,
        secure: true,
        auth: {
          user: "raj.harshit962@gmail.com",
          pass: "rofh wqpa zpsw hjtq"
        },
      });
// const transporter = nodemailer.createTransport({
//     host: "",
//     port: , // Your SMTP port (e.g., 587)
//   });

// Function to calculate milestone status
function calculateMilestoneStatus(data) {
    const today = dayjs();
    let status = "Stable"; // default status

    if (data.TradingPartnerSetup === "Completed") {
        if (data.SFTP === "Completed") {
            JSON.parse(data.TestingJSON).forEach((test) => {
                if (test.value !== "Completed") {
                    const testDate = dayjs(test.value);
                    const oneDayBefore = testDate.subtract(4, "day");
                    if (today.isAfter(testDate)) status = "Violated";
                    else if (today.isAfter(oneDayBefore)) status = "Critical";
                    else status = "Stable";
                } else if (test.value === "On Hold") {
                    status = "Critical";
                }
            });
        } else {
            status = evaluateDateStatus(data.SFTP, today);
        }
    } else {
        status = evaluateDateStatus(data.TradingPartnerSetup, today);
    }

    if (["TradingPartnerSetup", "SFTP", "GoLive"].some((field) => data[field] === "On Hold")) {
        status = "Critical";
    }

    return status;
}

// Helper function to evaluate date status
function evaluateDateStatus(dateValue, today) {
    const date = dayjs(dateValue);
    const oneDayBefore = date.subtract(4, "day");

    if (today.isAfter(date)) return "Violated";
    else if (today.isAfter(oneDayBefore)) return "Critical";
    return "Stable";
}

// Fetch data from MSSQL and process milestones
async function fetchDataAndProcessMilestones() {
    try {
        let pool = await sql.connect(sqlConfig);
        const result = await pool.request().query(`
            SELECT TOP (1000) [id],
                [RequestID],
                [Customer],
                [CarrierName],
                [SCAC],
                [SFTP],
                [TestingJSON],
                [GoLive],
                [OCValidation],
                [TradingPartnerSetup],
                [active],
                [Notes]
            FROM [data].[onboarding]
            WHERE active = 1
        `);

        result.recordset.forEach((record) => {
            const milestoneStatus = calculateMilestoneStatus(record);
            if (milestoneStatus === "Critical" || milestoneStatus === "Violated") {
                sendEmailNotification(record, milestoneStatus);
            }
        });

        await sql.close();
    } catch (err) {
        console.error("Database error:", err);
    }
}

// Function to send email notifications
function sendEmailNotification(data, status) {
    const mailOptions = {
        from: "your_email@gmail.com",
        to: "recipient_email@example.com", // Replace with the recipient's email
        subject: `Milestone ${status} Alert for Request ${data.RequestID}`,
        text: `Hello,\n\nThe milestone status for request ID "${data.RequestID}" with customer "${data.Customer}" is now "${status}". Immediate attention may be required.\n\nBest Regards,\nYour Team`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Error sending email:", error);
        } else {
            console.log(`Email sent: ${info.response}`);
        }
    });
}

// Schedule the task to fetch and process milestones
setInterval(fetchDataAndProcessMilestones, 1000 * 60 * 60); // Run every hour

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
