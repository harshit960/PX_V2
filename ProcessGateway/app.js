require("dotenv").config();
const express = require("express");
const sql = require("mssql");
const nodemailer = require("nodemailer");
const dayjs = require("dayjs");
const schedule = require("node-schedule");

const app = express();
const port = 3000;
const TestingMode = true
// MSSQL Configuration
if (TestingMode === true) {
  var SMTP_EMAIL = "raj.harshit962@gmail.com";
  var sqlConfig = {
    user: "newuser",
    password: "admin1234",
    database: "data2",
    server: 'localhost\HARSHIT',
    options: {
      encrypt: true,
      trustServerCertificate: true,
    },
  };
  var transporter = nodemailer.createTransport({
    service: "Gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: true,
    auth: {
      user: SMTP_EMAIL,
      pass: "rofh wqpa zpsw hjtq",
    },
  });

} else {
  var SMTP_EMAIL = process.env.SMTP_EMAIL;
  var sqlConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT),
    options: {
      encrypt: true, 
      trustServerCertificate: true 
    }
  };
  var transporter = nodemailer.createTransport({
    host: process.env.SMTP_SERVICE,
    port: process.env.SMTP_PORT,
  });

};



// Function to calculate milestone status
function calculateMilestoneStatus(data) {
  const today = dayjs();
  let status = "Stable";

  // Prioritize "On Hold" for criticality
  if (["TradingPartnerSetup", "SFTP", "GoLive"].some((field) => data[field] === "On Hold")) {
    status = "Critical";
    return status;
  }

  // Check dependencies based on completion status
  if (data.TradingPartnerSetup === "Completed") {
    // Handle SFTP completion
    if (data.SFTP === "Completed") {
      // Iterate through testing data, prioritizing "On Hold"
      JSON.parse(data.TestingJSON).forEach((test) => {
        if (test.value === "On Hold") {
          status = "Critical";
          return; // Exit the loop early if "On Hold" is found
        }

        const testDate = dayjs(test.value);
        const oneDayBefore = testDate.subtract(4, "day");

        switch (true) {
          case today.isAfter(testDate):
            status = "Violated";
            break;
          case today.isAfter(oneDayBefore):
            status = "Critical";
            break;
          default: // Today is before oneDayBefore (stable case)
            break;
        }
      });
    } else {
      // Evaluate SFTP completion date
      status = evaluateDateStatus(data.SFTP, today);
    }
  } else {
    // Evaluate Trading Partner Setup completion date
    status = evaluateDateStatus(data.TradingPartnerSetup, today);
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

    // Fetch onboarding data with active status
    const onboardingResult = await pool.request().query("SELECT * FROM [data].onboarding WHERE GoLive NOT IN ('Completed', 'Cancelled') AND active = 'true' AND OCValidation != 'Cancelled' ");

    // Process each record
    for (const record of onboardingResult.recordset) {
      const milestoneStatus = calculateMilestoneStatus(record);

      if (milestoneStatus === "Critical" || milestoneStatus === "Violated") {
        // Fetch IPOwner's email
        const emailResult = await pool.request()
          .input("IPOwnerName", sql.NVarChar, record.IPOwner)
          .query(`
                        SELECT email
                        FROM [data].[user]
                        WHERE name = @IPOwnerName
                    `);

        // Ensure email exists before sending
        const ipOwnerEmail = emailResult.recordset[0]?.email;
        if (ipOwnerEmail) {
          sendEmailNotification(record, milestoneStatus, ipOwnerEmail);
        } else {
          console.log(`Email not found for IPOwner: ${record.IPOwner}`);
        }
      }
    }

    await sql.close();
  } catch (err) {
    console.error("Database error:", err);
  }
}

// Function to send email notifications or console log
function sendEmailNotification(data, status, recipientEmail) {
  const message = `Milestone ${status} Alert for Request ${data.RequestID}: The milestone status for request ID "${data.RequestID}" with customer "${data.Customer}" is now "${status}". Immediate attention may be required.`;

  if (TestingMode === false) {
    const mailOptions = {
      from: SMTP_EMAIL,
      to: recipientEmail,
      subject: `Milestone ${status} Alert for Request ${data.RequestID}`,
      text: message,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
      } else {
        console.log(`Email sent: ${info.response}`);
      }
    });
  } else {
    console.log(`Email: ${recipientEmail} Testing mode: ${message}`);
  }
}

// Run the milestone processing immediately for testing
if (TestingMode === true){
  fetchDataAndProcessMilestones();
}else{
  // Schedule the task to run every Monday at 12:00 AM
  schedule.scheduleJob("0 0 * * 1", fetchDataAndProcessMilestones);
}


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
