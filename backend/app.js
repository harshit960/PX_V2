const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const jwt = require('jsonwebtoken');
let dayjs = require('dayjs');
const cors = require('cors');
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const { BlobServiceClient } = require('@azure/storage-blob');
const multer = require('multer');
const sql = require('mssql');  // Import mssql
const path = require('path');
const fs = require('fs');
app.use(bodyParser.json());
require('dotenv').config();

//                                 ------------TESTING----------------
app.use(cors());

// const connection = new sql.ConnectionPool({
//   user: 'newuser',
//   password: 'admin1234',
//   server: 'HARSHIT', // You can use 'localhost\\instance' to connect to named instance
//   database: 'data2',
//   options: {
//     encrypt: true, // Use this if you're on Windows Azure
//     trustServerCertificate: true // Use this if your SQL Server uses self-signed certificate
//   }
// });
//                                 ---X------X----X-----X-----X----X----X


//                                 -----------PRODUCTION---------------

// const corsOptions = {   origin: 'http://veuwcore1202.jdadelivers.com',  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',   credentials: true,optionsSuccessStatus: 204 }; app.use(cors(corsOptions));
// app.options('*');

const connection = new sql.ConnectionPool({
  server: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 1433,
  options: {
    encrypt: true, // Use this if you're on Windows Azure
    trustServerCertificate: true // Change to true for local dev / self-signed certs
  }
});

//                                 ---X------X----X-----X-----X----X----X



// Connect to the database
connection.connect(err => {
  if (err) {
    console.log(connection);
    
    console.error('Error connecting to database: ' + err.stack);
    return;
  }
  console.log('Connected to database');
});

function generateAccessToken(username) {
  return jwt.sign(username, "key", { expiresIn: '3600s' });
}

function authenticateToken(req, res, next) {
  // Get auth header value

  const authHeader = req.headers['authorization'];
  // Check if authHeader is undefined
  if (typeof authHeader !== 'undefined') {
    // Split at the space and get token from array
    const token = authHeader.split(' ')[1];
    // Verify token
    jwt.verify(token, "key", (err, user) => {
      if (err) {
        // console.log(err
        // If error, respond with 403 status code and error message
        return res.status(403).send('403');
      }
      // If token is verified, set req.user and call next middleware function
      req.user = user;
      next();
    });
  } else {
    // If authHeader is undefined, return 401 status code
    res.status(401).send('authHeader is undefined');
  }
}
// Set up the storage engine to store files in the "uploads" folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads');

    // Ensure the upload directory exists
    fs.mkdirSync(uploadPath, { recursive: true });

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

app.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded');
    }

    const filePath = path.join(__dirname, 'uploads', req.file.originalname);
    const publicUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.originalname}`;
    console.log(`File uploaded to ${publicUrl}`);

    res.status(200).send(`File uploaded successfully: ${filePath}`);
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).send('Error uploading file');
  }
});
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use((req, res, next) => {
  // Wait for the response to finish
  res.on('finish', () => {
    // Create a new log entry
    const logEntry = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      time: new Date(),
      body: JSON.stringify(req.body),
      user: JSON.stringify(req.user ? req.user.username : null) // Check if req.user exists
    };

    // Save the log entry to the database
    const query = 'INSERT INTO [data].[logs] (method, url, status, time, body, [user]) VALUES (@method, @url, @status, @time, @body, @user)';

    // Create a new request using the existing connection
    const request = new sql.Request(connection);

    // Add input parameters
    request.input('method', sql.NVarChar, logEntry.method);
    request.input('url', sql.NVarChar, logEntry.url);
    request.input('status', sql.Int, logEntry.status);
    request.input('time', sql.DateTime, logEntry.time);
    request.input('body', sql.NVarChar, logEntry.body);
    request.input('user', sql.NVarChar, logEntry.user);

    // Execute the query
    request.query(query, (err, result) => {
      if (err) {
        console.error('Error inserting log entry: ' + err.stack);
      }
    });
  });

  // Call the next middleware function
  next();
});
app.post('/login', (req, res) => {
  const { name, password } = req.body;
  const query = 'SELECT * FROM [data].[user] WHERE username = @name AND password = @password';

  // Create a new request using the existing connection
  const request = new sql.Request(connection);

  // Add input parameters
  request.input('name', sql.NVarChar, name);
  request.input('password', sql.NVarChar, password);

  // Execute the query
  request.query(query, (error, result) => {
    if (error) {
      console.error('Error executing query: ' + error.stack);
      return res.status(500).send('Error executing query');
    }

    if (result.recordset.length > 0) {
      const token = generateAccessToken({
        username: result.recordset[0].username,
        name: result.recordset[0].name,
        type: result.recordset[0].type,
        id: result.recordset[0].id,
        pp: result.recordset[0].pp
      });
      res.status(200).json({ "user": result.recordset[0], "jwt": token });
    } else {
      res.status(401).json('Invalid username or password');
    }
  });
});

// reset Pass
app.post('/reset-password', async (req, res) => {
  console.log(req.body)
  try {
    const result = await connection.request()
      .input('username', sql.VarChar, req.body.userId)
      .query(`
            SELECT [email]
            FROM [data].[user]
            WHERE [username] = @username;
        `);
    console.log(result);


    if (result.recordset[0].email == req.body.email) {

      token = jwt.sign({ userId: req.body.userId, email: req.body.email }, "key", { expiresIn: '1800s' })

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_SERVICE,
        port: process.env.SMTP_PORT, // Your SMTP port (e.g., 587)
      });
      // Set up mail options
      const mailOptions = {
        from: process.env.SMTP_EMAIL,
        to: req.body.email,
        // cc: process.env.CC_MAIL,
        subject: 'PartnerXchange Password Reset Request',
        text: `
        You recently requested to reset the password for your PartnerXchange account.
        Please click on this link in order to change your password.

        ${process.env.FRONTEND_URL}/reset-password/verify?token=${token}
        
        This link is valid for 30 minutes only.
        Request you to contact EDITeam@blueyonder.com if you are having any issues.
        `

      };

      // Send the email
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
      res.status(200).send("")
    }
    else {
      res.sendStatus(403)
    }
  } catch (error) {
    console.error(error);
    res.sendStatus(500)
  }


})

app.post('/verify-token', (req, res) => {
  try {
    var decoded = jwt.verify(req.body.token, 'key', 'wrong-secret');
    res.status(200).send({ msg: "verified" })
  } catch (err) {
    // err
    res.sendStatus(403)
  }
}
)

app.post('/change-password', async (req, res) => {
  try {
    var decoded = jwt.verify(req.body.token, 'key');
    
    if (req.body.newProfilePicture != "NA") { 
      const result = await connection.request()
      .input('username', sql.VarChar, decoded.userId)
      .input('newPassword', sql.VarChar, req.body.password)
      .input('newProfilePicture', sql.VarChar, req.body.newProfilePicture)
      .query('UPDATE [data].[user] SET password = @newPassword, pp = @newProfilePicture WHERE username = @username');
      console.log(result);
      if (result.rowsAffected[0] === 0) {
  
        return res.status(404).send('User not found');
      }
      res.status(200).send('User updated successfully');
    }
    else{
      const result = await connection.request()
      .input('username', sql.VarChar, decoded.userId)
      .input('newPassword', sql.VarChar, req.body.password)
      .query('UPDATE [data].[user] SET password = @newPassword WHERE username = @username');
      console.log(result);
      if (result.rowsAffected[0] === 0) {
  
        return res.status(404).send('User not found');
      }
      res.status(200).send('User updated successfully');
    }



  } catch (error) {
    console.log(error);

    res.send(403).send(JSON.stringify({ error: error }))
  }

})
app.use(authenticateToken);
const validateUser = [
  body('name').not().isEmpty().withMessage('Name is required'),
  body('password').isLength({ min: 5 }).withMessage('Password must be at least 5 chars long'),
  body('Avatar').isURL().withMessage('Avatar must be a URL'),
  body('type').not().isEmpty().withMessage('Type is required'),
  body('username').not().isEmpty().withMessage('Username is required'),
  body('email').isEmail().withMessage('Email is required and should be an email'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];
app.post('/newuser', (req, res) => {
  // Assuming you have a connection to your SQL Server database

  let sql1 = `INSERT INTO [data].[user] (name, password, pp, type, username, email) VALUES (@name, @password, @pp, @type, @username, @email)`;
  let request1 = new sql.Request(connection);
  request1.input('name', sql.NVarChar, req.body.name);
  request1.input('password', sql.NVarChar, req.body.password);
  request1.input('pp', sql.NVarChar, req.body.Avatar);
  request1.input('type', sql.NVarChar, req.body.type);
  request1.input('username', sql.NVarChar, req.body.username);
  request1.input('email', sql.NVarChar, req.body.email);


  request1.query(sql1, (err, result) => {
    if (err) {
      console.error('Error inserting record into user table: ' + err.stack);
      return res.status(500).send('Error adding new user');
    }
    if (req.body.type === "user") {
      let sql2 = `INSERT INTO [data].[leaderboard] ([user]) VALUES (@username)`;
      let request2 = new sql.Request(connection);
      request2.input('username', sql.NVarChar, req.body.name);

      request2.query(sql2, (err, result) => {
        if (err) {
          console.error('Error inserting record into leaderboard table: ' + err.stack);
          return res.status(500).send('Error adding new user');
        }
        res.status(200).send('Data added successfully');
      });
    } else {
      res.status(200).send('Data added successfully');
    }
  });
});
app.get('/user', (req, res) => {
  // Execute the query
  const query = 'SELECT name, type, Implementor, Developer FROM [data].[user]';

  // Create a new request using the existing connection
  const request = new sql.Request(connection);

  // Execute the query
  request.query(query, (error, results) => {
    if (error) {
      console.error('Error executing query: ' + error.stack);
      return res.status(500).send('Error executing query');
    }
    res.json(results.recordset);
  });
});
app.get('/leaderboard', (req, res) => {
  // Execute the query
  const query = `
      SELECT [data].[leaderboard].id, 
             [data].[leaderboard].[user], 
             [data].[leaderboard].onboard_capacity, 
             [data].[leaderboard].projectCapacity, 
             [data].[leaderboard].files,
             [data].[leaderboard].milestone,
             [data].[leaderboard].TopPerformer,
             [data].[leaderboard].Notes,
             [data].[leaderboard].dateRange,
             [data].[user].pp, 
             [data].[user].type 
      FROM [data].[leaderboard] 
      JOIN [data].[user] ON [data].[leaderboard].[user] = [data].[user].name`;

  // Create a new request using the existing connection
  const request = new sql.Request(connection);

  // Execute the query
  request.query(query, (error, results) => {
    if (error) {
      console.error('Error executing query: ' + error.stack);
      return res.status(500).send('Error executing query');
    }
    res.json(results.recordset);
  });
});
app.get('/leaderboard/:username', (req, res) => {
  // Execute the query
  const query = 'SELECT [data].leaderboard.onboard_capacity FROM [data].leaderboard WHERE [data].leaderboard.[user] = @username';

  // Create a new request using the existing connection
  const request = new sql.Request(connection);

  // Add input parameter
  request.input('username', sql.NVarChar, req.params.username);

  // Execute the query
  request.query(query, (error, results) => {
    if (error) {
      console.error('Error executing query: ' + error.stack);
      return res.status(500).send('Error executing query');
    }
    res.json(results.recordset);
  });
});
app.get('/archive', (req, res) => {
  // Execute the query
  const query = `
      SELECT [data].LBarchive.id, 
             [data].LBarchive.date, 
             [data].LBarchive.[user], 
             [data].LBarchive.files, 
             [data].[user].pp 
      FROM [data].LBarchive 
      JOIN [data].[user] ON [data].LBarchive.[user] = [user].name`;

  // Create a new request using the existing connection
  const request = new sql.Request(connection);

  // Execute the query
  request.query(query, (error, results) => {
    if (error) {
      console.error('Error executing query: ' + error.stack);
      return res.status(500).send('Error executing query');
    }
    res.json(results.recordset);
  });
});
app.put('/updateLB/:id', (req, res) => {
  // Extract data from the request body
  const { projectCapacity, onboard_capacity, file, achieBtn, Notes, dateRange } = req.body;
  const id = req.params.id;
  const timechange = req.body.timeChange;

  // Update query for leaderboard table
  const updateQuery = `
      UPDATE [data].leaderboard 
      SET  
          projectCapacity = @projectCapacity, 
          onboard_capacity = @onboard_capacity,
          files = @file,
          TopPerformer = @achieBtn,
          Notes = @Notes,
          dateRange = @dateRange 
      WHERE id = @id`;

  // Create a new request using the existing connection
  const request = new sql.Request(connection);

  // Add input parameters
  request.input('projectCapacity', sql.NVarChar, projectCapacity);
  request.input('onboard_capacity', sql.NVarChar, onboard_capacity);
  request.input('file', sql.NVarChar, file);
  request.input('achieBtn', sql.NVarChar, achieBtn);
  request.input('Notes', sql.NVarChar, Notes);
  request.input('dateRange', sql.NVarChar, dateRange);
  request.input('id', sql.Int, id);

  // Execute the update query
  request.query(updateQuery, (error, results) => {
    if (error) {
      console.error('Error executing update query: ' + error.stack);
      return res.status(500).send('Error updating data');
    }

    res.status(200).json('Data updated successfully');
  });

  // Check if timechange is true and insert into LBarchive table
  if (timechange) {
    if (req.body.ShiftChange == true || JSON.parse(dateRange).type == "") {
      // console.log(dayjs(JSON.parse(ShiftHour).ShiftStart).format("h:mm A"));
      var data = {
        user: req.body.user,
        ShiftHour: ShiftHour,
        date: dayjs().format("DD/MM/YYYY"),
        file: req.body.file
      };
    }
    else {
      var data = {
        user: req.body.user,
        ShiftHour: JSON.parse(dateRange).type,
        date: dayjs().format("DD/MM/YYYY"),
        file: req.body.file
      };
    }

    // Insert query for LBarchive table
    const insertQuery = 'INSERT INTO [data].LBarchive ([user], ShiftHour, date, files) VALUES (@user, @ShiftHour, @date, @file)';

    // Create a new request for insertion
    const insertRequest = new sql.Request(connection);

    // Add input parameters for insertion
    insertRequest.input('user', sql.NVarChar, data.user);
    insertRequest.input('ShiftHour', sql.NVarChar, data.ShiftHour);
    insertRequest.input('date', sql.NVarChar, data.date);
    insertRequest.input('file', sql.NVarChar, data.file);

    // Execute the insert query
    insertRequest.query(insertQuery, (err, result) => {
      if (err) {
        console.error('Error inserting into LBarchive table: ' + err.stack);
        return res.status(500).send('Error inserting into LBarchive table');
      }
      // Optional: Send response if needed
      // res.send('Data inserted into LBarchive...');
    });
  }
});
app.put('/updateMilestone/:id', (req, res) => {
  // Extract data from the request body
  const id = req.params.id;

  // Select query to retrieve the leaderboard record
  const selectQuery = 'SELECT * FROM [data].leaderboard WHERE [user] = @id';

  // Create a new request using the existing connection
  const request = new sql.Request(connection);

  // Add input parameter for the user id
  request.input('id', sql.NVarChar, id);

  // Execute the select query to retrieve the leaderboard record
  request.query(selectQuery, (error, results) => {
    if (error) {
      console.error('Error executing select query: ' + error.stack);
      return res.status(500).send('Error executing select query');
    }

    // Parse the milestone JSON string from the retrieved record
    var milestone = JSON.parse(results.recordset[0].milestone);

    // Push the new milestone data into the milestone array
    if (milestone) {
      milestone.push(req.body);
    }
    else {
      milestone = [];
      milestone.push(req.body);
    }

    // Update query to update the milestone field in the leaderboard table
    const updateQuery = 'UPDATE [data].leaderboard SET milestone = @milestone WHERE id = @recordId';

    // Create a new request for the update operation
    const updateRequest = new sql.Request(connection);

    // Add input parameters for the updated milestone and record id
    updateRequest.input('milestone', sql.NVarChar, JSON.stringify(milestone));
    updateRequest.input('recordId', sql.Int, results.recordset[0].id);

    // Execute the update query
    updateRequest.query(updateQuery, (error, updateResults) => {
      if (error) {
        console.error('Error executing update query: ' + error.stack);
        return res.status(500).send('Error executing update query');
      }

      res.status(200).json('Data updated successfully');
    });
  });
});
app.put('/updateP/:id', (req, res) => {
  // Extract data from the request body
  const { CEnv, CMilestone, CQA, CProduction, CGoLive, CProjectLead, Jira, Severity, DevEnviornment, BYRemark, Notes } = req.body;
  const id = req.params.id;

  // Update query for projects table
  const updateQuery = `
      UPDATE [data].projects 
      SET Environment = @CEnv, 
          Milestone = @CMilestone, 
          QAEnviornment = @CQA,
          Production = @CProduction,
          GoLive = @CGoLive,
          ProjectLead = @CProjectLead,
          Jira = @Jira,
          Severity = @Severity,
          DevEnviornment = @DevEnviornment,
          BYRemark = @BYRemark,
          Notes = @Notes
      WHERE id = @id`;

  // Create a new request using the existing connection
  const request = new sql.Request(connection);

  // Add input parameters for the update query
  request.input('CEnv', sql.NVarChar, CEnv);
  request.input('CMilestone', sql.NVarChar, CMilestone);
  request.input('CQA', sql.NVarChar, CQA);
  request.input('CProduction', sql.NVarChar, CProduction);
  request.input('CGoLive', sql.NVarChar, CGoLive);
  request.input('CProjectLead', sql.NVarChar, CProjectLead);
  request.input('Jira', sql.NVarChar, Jira);
  request.input('Severity', sql.NVarChar, Severity);
  request.input('DevEnviornment', sql.NVarChar, DevEnviornment);
  request.input('BYRemark', sql.NVarChar, BYRemark);
  request.input('Notes', sql.NVarChar, Notes);
  request.input('id', sql.Int, id);

  // Execute the update query
  request.query(updateQuery, (error, results) => {
    if (error) {
      console.error('Error executing update query: ' + error.stack);
      return res.status(500).send('Error executing update query');
    }

    res.status(200).json('Data updated successfully');
  });
});
app.post('/newProject', (req, res) => {
  const { RequestID, Customer, ProjectedGoLive, Milestone, EDIVersion, EDIMessageType, ProjectLead, Environment, CarrierOnboarding, Dev_Environment, Production, GoLive, QAEnviornment, MappingSpecification, CustomerCode, BYRemark, ProjectType, Implementor, Developer } = req.body;

  // Insert query for projects table
  const insertQuery = `
      INSERT INTO [data].projects 
      (RequestID, Customer, ProjectedGoLive, Milestone, EDIVersion, EDIMessageType, ProjectLead, Environment, CarrierOnboarding, DevEnviornment, Production, GoLive, QAEnviornment, MappingSpecification, CustomerCode, BYRemark, ProjectType, Implementor, Developer) 
      VALUES 
      (@RequestID, @Customer, @ProjectedGoLive, @Milestone, @EDIVersion, @EDIMessageType, @ProjectLead, @Environment, @CarrierOnboarding, @Dev_Environment, @Production, @GoLive, @QAEnviornment, @MappingSpecification, @CustomerCode, @BYRemark, @ProjectType, @Implementor, @Developer)`;

  // Create a new request using the existing connection
  const request = new sql.Request(connection);

  // Add input parameters for the insert query
  request.input('RequestID', sql.NVarChar, RequestID);
  request.input('Customer', sql.NVarChar, Customer);
  request.input('ProjectedGoLive', sql.NVarChar, ProjectedGoLive);
  request.input('Milestone', sql.NVarChar, Milestone);
  request.input('EDIVersion', sql.NVarChar, EDIVersion);
  request.input('EDIMessageType', sql.NVarChar, EDIMessageType);
  request.input('ProjectLead', sql.NVarChar, ProjectLead);
  request.input('Environment', sql.NVarChar, Environment);
  request.input('CarrierOnboarding', sql.NVarChar, CarrierOnboarding);
  request.input('Dev_Environment', sql.NVarChar, Dev_Environment);
  request.input('Production', sql.NVarChar, Production);
  request.input('GoLive', sql.NVarChar, GoLive);
  request.input('QAEnviornment', sql.NVarChar, QAEnviornment);
  request.input('MappingSpecification', sql.NVarChar, MappingSpecification);
  request.input('CustomerCode', sql.NVarChar, CustomerCode);
  request.input('BYRemark', sql.NVarChar, BYRemark);
  request.input('ProjectType', sql.NVarChar, ProjectType);
  request.input('Implementor', sql.NVarChar, Implementor);
  request.input('Developer', sql.NVarChar, Developer);

  // Execute the insert query
  request.query(insertQuery, (error, results) => {
    if (error) {
      console.error('Error executing insert query: ' + error.stack);
      return res.status(500).send('Error executing insert query');
    }

    res.status(201).send('Project added successfully');
  });
});
app.get('/projects', (req, res) => {
  // Select all projects from the database
  const query = `
      SELECT * 
      FROM [data].projects 
      WHERE GoLive NOT IN ('Cancelled') 
      AND DevEnviornment != 'Cancelled' 
      AND Production != 'Cancelled' 
      AND QAEnviornment != 'Cancelled' 
      AND (ProjectType != 'Upgrade' OR (ProjectType = 'Upgrade' AND GoLive != 'Completed'))`;

  // Create a new request using the existing connection
  const request = new sql.Request(connection);

  // Execute the select query
  request.query(query, (error, results) => {
    if (error) {
      console.error('Error executing query: ' + error.stack);
      return res.status(500).send('Error executing query');
    }
    res.status(200).json(results.recordset);
  });
});
app.get('/projects/:ProjectLead', (req, res) => {
  // Select all projects for a specific ProjectLead from the database
  const query = `
      SELECT * 
      FROM [data].projects p
      CROSS APPLY STRING_SPLIT(p.ProjectLead, ',') AS pl
  WHERE LTRIM(RTRIM(pl.value)) = @ProjectLead
      AND GoLive NOT IN ('Cancelled', 'Completed') 
      AND DevEnviornment != 'Cancelled' 
      AND Production != 'Cancelled' 
      AND QAEnviornment != 'Cancelled' 
      AND (ProjectType != 'Upgrade' OR (ProjectType = 'Upgrade' AND GoLive != 'Completed'))`;

  // Create a new request using the existing connection
  const request = new sql.Request(connection);

  // Add input parameter for the ProjectLead
  request.input('ProjectLead', sql.NVarChar, req.params.ProjectLead);

  // Execute the select query
  request.query(query, (error, results) => {
    if (error) {
      console.error('Error executing query: ' + error.stack);
      return res.status(500).send('Error executing query');
    }
    res.status(200).json(results.recordset);
  });
});
app.post('/newRequest', (req, res) => {
  // console.log(req.body);
  const { RequestID, Customer, CarrierName, SCAC, Phase, Completion, Milestone, TPSpecialist, TicketNumber, BYRemarks, IPOwner, SFTP, Testing204, TestingIFTMIN, TestingIFTSTA, GoLive, TestingJSON, TradingPartnerSetup, disabledArray } = req.body;

  // Insert query for onboarding table
  const insertQuery = `
      INSERT INTO [data].onboarding 
      (RequestID, Customer, CarrierName, SCAC, Phase, Completion, Milestone, TPSpecialist, TicketNumber, BYRemarks, IPOwner, SFTP, Testing204, TestingIFTMIN, TestingIFTSTA, GoLive, TestingJSON, TradingPartnerSetup, disabledArray) 
      VALUES 
      (@RequestID, @Customer, @CarrierName, @SCAC, @Phase, @Completion, @Milestone, @TPSpecialist, @TicketNumber, @BYRemarks, @IPOwner, @SFTP, @Testing204, @TestingIFTMIN, @TestingIFTSTA, @GoLive, @TestingJSON, @TradingPartnerSetup, @disabledArray)`;

  // Create a new request using the existing connection
  const request = new sql.Request(connection);

  // Add input parameters for the insert query
  request.input('RequestID', sql.NVarChar, RequestID);
  request.input('Customer', sql.NVarChar, Customer);
  request.input('CarrierName', sql.NVarChar, CarrierName);
  request.input('SCAC', sql.NVarChar, SCAC);
  request.input('Phase', sql.NVarChar, Phase);
  request.input('Completion', sql.NVarChar, Completion);
  request.input('Milestone', sql.NVarChar, Milestone);
  request.input('TPSpecialist', sql.NVarChar, TPSpecialist);
  request.input('TicketNumber', sql.NVarChar, TicketNumber);
  request.input('BYRemarks', sql.NVarChar, BYRemarks);
  request.input('IPOwner', sql.NVarChar, IPOwner);
  request.input('SFTP', sql.NVarChar, SFTP);
  request.input('Testing204', sql.NVarChar, Testing204);
  request.input('TestingIFTMIN', sql.NVarChar, TestingIFTMIN);
  request.input('TestingIFTSTA', sql.NVarChar, TestingIFTSTA);
  request.input('GoLive', sql.NVarChar, GoLive);
  request.input('TestingJSON', sql.NVarChar, TestingJSON);
  request.input('TradingPartnerSetup', sql.NVarChar, TradingPartnerSetup);
  request.input('disabledArray', sql.NVarChar, disabledArray);

  // Execute the insert query
  request.query(insertQuery, (error, results) => {
    if (error) {
      console.error('Error executing insert query: ' + error.stack);
      return res.status(500).send('Error executing insert query');
    }

    res.status(201).send('Record added successfully');
  });
});
app.patch('/updateOB/:id', (req, res) => {
  // Extract data from the request body
  // console.log(req.body)
  const { IPOwner, OCValidation,ResponsibleParty, Testing204, GoLive, TestingJSON, SFTP, BYRemarks, TradingPartnerSetup, Completion, Milestone, disabledArray, active, Notes } = req.body;
  const id = req.params.id;

  // Update query for onboarding table
  const updateQuery = `
      UPDATE [data].onboarding 
      SET IPOwner = @IPOwner, 
          OCValidation = @OCValidation, 
          ResponsibleParty = @ResponsibleParty, 
          Testing204 = @Testing204,
          GoLive = @GoLive,
          TestingJSON = @TestingJSON,
          SFTP = @SFTP,
          BYRemarks = @BYRemarks,
          TradingPartnerSetup = @TradingPartnerSetup,
          Completion = @Completion,
          Milestone = @Milestone,
          disabledArray = @disabledArray,
          active = @active,
          Notes = @Notes
      WHERE id = @id`;

  // Create a new request using the existing connection
  const request = new sql.Request(connection);

  // Add input parameters for the update query
  request.input('IPOwner', sql.NVarChar, IPOwner);
  request.input('ResponsibleParty', sql.NVarChar, ResponsibleParty);
  request.input('OCValidation', sql.NVarChar, OCValidation);
  request.input('Testing204', sql.NVarChar, Testing204);
  request.input('GoLive', sql.NVarChar, GoLive);
  request.input('TestingJSON', sql.NVarChar, TestingJSON);
  request.input('SFTP', sql.NVarChar, SFTP);
  request.input('BYRemarks', sql.NVarChar, BYRemarks);
  request.input('TradingPartnerSetup', sql.NVarChar, TradingPartnerSetup);
  request.input('Completion', sql.NVarChar, Completion);
  request.input('Milestone', sql.NVarChar, Milestone);
  request.input('disabledArray', sql.NVarChar, disabledArray);
  request.input('active', sql.NVarChar, active);
  request.input('Notes', sql.NVarChar, Notes);
  request.input('id', sql.Int, id);

  // Execute the update query
  request.query(updateQuery, (error, results) => {
    if (error) {
      console.error('Error executing update query: ' + error.stack);
      return res.status(500).send('Error executing update query');
    }

    res.status(200).json('Data updated successfully');
  });
});
app.patch('/uploadCQdoc/:id', (req, res) => {
  // Extract data from the request body
  console.log(req.body);
  const { CQDoc, OCValidation, TestingJSON, TradingPartnerSetup, SFTP, GoLive, disabledArray } = req.body;
  const id = req.params.id;

  // Update query for onboarding table
  const updateQuery = `
      UPDATE [data].onboarding 
      SET CQDoc = @CQDoc, 
          OCValidation = @OCValidation, 
          TestingJSON = @TestingJSON,
          TradingPartnerSetup = @TradingPartnerSetup,
          SFTP = @SFTP,
          GoLive = @GoLive,
          disabledArray = @disabledArray
      WHERE id = @id`;

  // Create a new request using the existing connection
  const request = new sql.Request(connection);

  // Add input parameters for the update query
  request.input('CQDoc', sql.NVarChar, CQDoc);
  request.input('OCValidation', sql.NVarChar, OCValidation);
  request.input('TestingJSON', sql.NVarChar, TestingJSON);
  request.input('TradingPartnerSetup', sql.NVarChar, TradingPartnerSetup);
  request.input('SFTP', sql.NVarChar, SFTP);
  request.input('GoLive', sql.NVarChar, GoLive);
  request.input('disabledArray', sql.NVarChar, disabledArray);
  request.input('id', sql.Int, id);

  // Execute the update query
  request.query(updateQuery, (error, results) => {
    if (error) {
      console.error('Error executing update query: ' + error.stack);
      return res.status(500).send('Error executing update query');
    }

    res.status(200).json('Data updated successfully');
  });
});
app.put('/editOB/:id', (req, res) => {
  // Extract data from the request body
  // console.log(req.body);
  const { CarrierName, SCAC, TestingJSON, TicketNumber, SFTP, TradingPartnerSetup, GoLive } = req.body;
  const id = req.params.id;

  // Update query for onboarding table
  const updateQuery = `
      UPDATE [data].onboarding 
      SET CarrierName = @CarrierName, 
          SCAC = @SCAC, 
          TestingJSON = @TestingJSON,
          TicketNumber = @TicketNumber,
          SFTP = @SFTP,
          TradingPartnerSetup = @TradingPartnerSetup,
          GoLive = @GoLive
      WHERE id = @id`;

  // Create a new request using the existing connection
  const request = new sql.Request(connection);

  // Add input parameters for the update query
  request.input('CarrierName', sql.NVarChar, CarrierName);
  request.input('SCAC', sql.NVarChar, SCAC);
  request.input('TestingJSON', sql.NVarChar, TestingJSON);
  request.input('TicketNumber', sql.NVarChar, TicketNumber);
  request.input('SFTP', sql.NVarChar, SFTP);
  request.input('TradingPartnerSetup', sql.NVarChar, TradingPartnerSetup);
  request.input('GoLive', sql.NVarChar, GoLive);
  request.input('id', sql.Int, id);

  // Execute the update query
  request.query(updateQuery, (error, results) => {
    if (error) {
      console.error('Error executing update query: ' + error.stack);
      return res.status(500).send('Error executing update query');
    }

    res.status(200).send('Row updated successfully.');
  });
});
app.put('/editPJ/:id', (req, res) => {
  console.log(req.body);
  const { id } = req.params;
  const { Customer, CustomerCode, EDIVersion, EDIMessageType, ProjectedGoLive, GoLive, QAEnviornment, DevEnviornment, Production, MappingSpecification, ProjectType, Implementor, Developer } = req.body;

  // Update query for projects table
  const updateQuery = `
      UPDATE [data].projects 
      SET Customer = @Customer, 
          CustomerCode = @CustomerCode, 
          EDIVersion = @EDIVersion, 
          EDIMessageType = @EDIMessageType, 
          ProjectedGoLive = @ProjectedGoLive, 
          GoLive = @GoLive, 
          QAEnviornment = @QAEnviornment, 
          DevEnviornment = @DevEnviornment, 
          Production = @Production, 
          MappingSpecification = @MappingSpecification, 
          ProjectType = @ProjectType, 
          Implementor = @Implementor, 
          Developer = @Developer 
      WHERE id = @id`;

  // Create a new request using the existing connection
  const request = new sql.Request(connection);

  // Add input parameters for the update query
  request.input('Customer', sql.NVarChar, Customer);
  request.input('CustomerCode', sql.NVarChar, CustomerCode);
  request.input('EDIVersion', sql.NVarChar, EDIVersion);
  request.input('EDIMessageType', sql.NVarChar, EDIMessageType);
  request.input('ProjectedGoLive', sql.NVarChar, ProjectedGoLive);
  request.input('GoLive', sql.NVarChar, GoLive);
  request.input('QAEnviornment', sql.NVarChar, QAEnviornment);
  request.input('DevEnviornment', sql.NVarChar, DevEnviornment);
  request.input('Production', sql.NVarChar, Production);
  request.input('MappingSpecification', sql.NVarChar, MappingSpecification);
  request.input('ProjectType', sql.NVarChar, ProjectType);
  request.input('Implementor', sql.NVarChar, Implementor);
  request.input('Developer', sql.NVarChar, Developer);
  request.input('id', sql.Int, id);

  // Execute the update query
  request.query(updateQuery, (error, results) => {
    if (error) {
      console.error('Error executing update query: ' + error.stack);
      return res.status(500).send('An error occurred while updating the project.');
    }

    res.status(200).send('Project updated successfully.');
  });
});
app.get('/getOB', (req, res) => {
  // Query to get all records from the onboarding table
  const query = "SELECT * FROM [data].onboarding WHERE GoLive NOT IN ('Completed', 'Cancelled') AND active = 'true' AND OCValidation != 'Cancelled' ";

  // Create a new request using the existing connection
  const request = new sql.Request(connection);

  // Execute the query
  request.query(query, (error, results) => {
    if (error) {
      console.error('Error executing query: ' + error.stack);
      return res.status(500).send('Error executing query');
    }

    res.status(200).json(results.recordset);
  });
});
app.get('/getOB/:IPOwner', (req, res) => {
  // Select all records from the onboarding table for a specific IPOwner
  const query = 'SELECT * FROM [data].onboarding WHERE IPOwner = @IPOwner AND GoLive NOT IN (\'Completed\', \'Cancelled\') AND active = \'true\' AND OCValidation != \'Cancelled\'';

  // Create a new request using the existing connection
  const request = new sql.Request(connection);

  // Add input parameter for IPOwner
  request.input('IPOwner', sql.NVarChar, req.params.IPOwner);

  // Execute the query
  request.query(query, (error, results) => {
    if (error) {
      console.error('Error executing query: ' + error.stack);
      return res.status(500).send('Error executing query');
    }
    res.status(200).json(results.recordset);
  });
});
app.delete('/deleteOB/:id', (req, res) => {
  // Delete a record from the onboarding table based on the provided id
  const query = 'DELETE FROM [data].onboarding WHERE id = @id';

  // Create a new request using the existing connection
  const request = new sql.Request(connection);

  // Add input parameter for id
  request.input('id', sql.Int, req.params.id);

  // Execute the query
  request.query(query, (error, results) => {
    if (error) {
      console.error('Error executing query: ' + error.stack);
      return res.status(500).send('Error executing query');
    }
    res.status(200).send('Record deleted successfully');
  });
});
app.delete('/deleteP/:id', (req, res) => {
  try {
    // Check if the project exists in the onboarding table
    const onboardingQuery = 'SELECT * FROM [data].onboarding WHERE id = @id';
    const onboardingRequest = new sql.Request(connection);
    onboardingRequest.input('id', sql.Int, req.params.id);
    onboardingRequest.query(onboardingQuery, (error, results) => {
      if (error) {
        console.error('Error checking onboarding table: ' + error.stack);
        return res.status(500).json({ err: 'Error checking onboarding table' });
      }

      // If the project exists in the onboarding table, do not delete it
      if (results.recordset.length > 0) {
        return res.status(400).json({ err: 'Cannot delete this project as it already exists in Onboarding' });
      }

      // If the project does not exist in the onboarding table, proceed with deletion from the projects table
      const projectDeleteQuery = 'DELETE FROM [data].projects WHERE id = @id';
      const projectDeleteRequest = new sql.Request(connection);
      projectDeleteRequest.input('id', sql.Int, req.params.id);
      projectDeleteRequest.query(projectDeleteQuery, (error, results) => {
        if (error) {
          console.error('Error executing delete query: ' + error.stack);
          return res.status(500).json({ err: 'Error executing delete query' });
        }
        res.status(200).send('Project deleted successfully');
      });
    });
  } catch (error) {
    console.error('Error: ' + error.stack);
    res.status(500).json({ err: 'An error occurred' });
  }
});
app.get('/getOBCustomer/:Customer', (req, res) => {
  // Select all records from the onboarding table for a specific Customer
  const query = 'SELECT * FROM [data].onboarding WHERE Customer = @Customer';

  // Create a new request using the existing connection
  const request = new sql.Request(connection);

  // Add input parameter for Customer
  request.input('Customer', sql.NVarChar, req.params.Customer);

  // Execute the query
  request.query(query, (error, results) => {
    if (error) {
      console.error('Error executing query: ' + error.stack);
      return res.status(500).send('Error executing query');
    }
    res.status(200).json(results.recordset);
  });
});
app.post('/newNoti', async (req, res) => {
  const { userID, msg, assignedBY, onEmail } = req.body;
  
  try {
    if (onEmail != false) {
      console.log("mail triggend");

      // Get the email of the user
      const emailResult = await connection.request()
        .input('userID', sql.NVarChar, userID)
        .query('SELECT email FROM [data].[user] WHERE name = @userID');

      if (emailResult.recordset.length === 0) {
        return res.status(404).send('User not found');
      }

      const mail = emailResult.recordset[0].email;

      // Configure the mail transporter
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_SERVICE,
        port: process.env.SMTP_PORT, // Your SMTP port (e.g., 587)

      });

      // Set up mail options
      const mailOptions = {
        from: process.env.SMTP_EMAIL,
        to: mail,
        subject: 'EDI PartnerXchange notification',
        text: msg,
        cc: process.env.CC_MAIL
      };

      // Send the email
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });

    }
    // Insert the new notification record
    await connection.request()
      .input('userID', sql.NVarChar, userID)
      .input('msg', sql.NVarChar, msg)
      .input('assignedBY', sql.NVarChar, assignedBY)
      .query('INSERT INTO [data].notification (userID, msg, assignedBY) VALUES (@userID, @msg, @assignedBY)');

    res.status(201).json({ message: 'Notification created' });

  } catch (error) {
    console.error('Error executing query: ' + error.stack);
    res.status(500).send('Error executing query');
  }
});
app.post('/sendEmail', (req, res) => {
  const { body } = req.body;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_SERVICE,
    port: process.env.SMTP_PORT, // Your SMTP port (e.g., 587)

  });

  const toList = process.env.TO_LIST.split(','); // Assuming the TO_LIST environment variable contains a comma-separated list of email addresses
  const mailOptions = {
    from: process.env.SMTP_EMAIL,
    to: toList,
    subject: 'EDI PartnerXchange notification',
    text: body,
    cc: process.env.CC_MAIL
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      res.status(500).json({ error: 'Failed to send email' });
    } else {
      console.log('Email sent: ' + info.response);
      res.status(200).json({ message: 'Email sent successfully' });
    }
  });
});
app.get('/getNoti/:id', async (req, res) => {
  const id = req.params.id;

  try {
    // Execute the query to get notifications for the given userID
    const result = await connection.request()
      .input('userID', sql.NVarChar, id)
      .query('SELECT * FROM [data].notification WHERE userID = @userID');

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Error executing query: ' + error.stack);
    res.status(500).send('Error executing query');
  }
});
app.post('/deleteNotifications', async (req, res) => {
  const idsToDelete = req.body.ids; // assuming you're sending an array of ids in the request body

  if (idsToDelete && idsToDelete.length > 0) {
    // Create a parameterized query to prevent SQL injection
    const params = idsToDelete.map((id, index) => `@id${index}`).join(', ');
    const query = `DELETE FROM [data].notification WHERE id IN (${params})`;

    try {
      const request = connection.request();
      idsToDelete.forEach((id, index) => {
        request.input(`id${index}`, sql.Int, id);
      });

      const result = await request.query(query);
      console.log(result);
      res.send('Notifications deleted');
    } catch (err) {
      console.error('Error executing query: ' + err.stack);
      res.status(500).send('Error executing query');
    }
  } else {
    res.status(400).send('No ids provided');
  }
});
app.get('/ob/archive', async (req, res) => {
  try {
    const query = `
      SELECT * 
      FROM [data].onboarding 
      WHERE GoLive = 'Completed' 
      OR GoLive = 'Cancelled' 
      OR active = 'false' 
      OR OCValidation = 'Cancelled'
    `;

    const result = await connection.request().query(query);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Error executing query: ' + error.stack);
    res.status(500).json({ error: 'An error occurred while fetching data.' });
  }
});
app.get('/pj/archive', async (req, res) => {
  try {
    const query = `
      SELECT * 
      FROM [data].projects 
      WHERE 
        (GoLive = 'Cancelled' OR Production = 'Cancelled' OR DevEnviornment = 'Cancelled' OR QAEnviornment = 'Cancelled') 
        OR 
        (ProjectType = 'Upgrade' AND GoLive = 'Completed')
    `;

    const result = await connection.request().query(query);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Error executing query: ' + error.stack);
    res.status(500).json({ error: 'An error occurred while fetching data.' });
  }
});
// Close the database connection when the app is terminated
process.on('SIGINT', () => {
  connection.end((err) => {
    if (err) {
      console.error('Error closing database connection: ' + err.stack);
      return;
    }
    console.log('Database connection closed');
    process.exit();
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
