# PartnerXchange (PX_V2)

PartnerXchange is a comprehensive EDI (Electronic Data Interchange) partner and project management application designed to streamline the onboarding, tracking, and management of EDI integrations and trading partners.

## 🚀 Tech Stack

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**:
  - TailwindCSS
  - Material UI components
  - Styled Components
- **State Management**: Context API
- **Routing**: React Router v6
- **Date Handling**: dayjs
- **Form Validation**: Yup
- **Data Visualization**:
  - React Big Calendar
  - React CSV
  - HTML2Canvas & jsPDF for PDF exports
- **UI Components**:
  - React Select
  - React Tag Input
  - React Flatpickr
  - MUI Date Pickers
- **HTTP Client**: Axios
- **Authentication**: JWT (jwt-decode)
- **Notifications**: React Toastify

### Backend
- **Server**: Express.js
- **Database**: Microsoft SQL Server
- **Authentication**: JWT
- **File Storage**: Azure Blob Storage
- **Email**: Nodemailer
- **Validation**: Express Validator

## 📂 Project Structure

```
PX_V2/
├── frontend/
│   ├── public/
│   │   ├── Avatar/         # Profile pictures
│   │   └── uploads/        # Document storage
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # React context providers
│   │   ├── pages/          # Page components
│   │   └── App.jsx         # Main application component
│   ├── .env                # Environment variables
│   └── package.json        # Dependencies and scripts
├── backend/
│   └── app.js             # Express server
```

## 🛡️ Features

### Authentication & User Management
- Secure JWT-based authentication
- Role-based access control (admin, User-PR, User-OB, view)
- Password reset functionality
- User profile management with customizable avatars

### Project Management
- Create and track EDI implementation projects
- Support for different project types (New, Live, Upgrade)
- Project milestone tracking with status indicators
- Document management for mapping specifications
- Designated project leads, developers, and implementors

### Onboarding Management
- Carrier onboarding process tracking
- Phase-based workflow management
- Trading partner setup tracking
- SFTP configuration management

### EDI Message Management
- Support for various EDI message types:
  - X12: 204, 214, 301, 990, 315, 323, etc.
  - EDIFACT: IFTMIN, IFTSTA, IFTMBF, IFCSUM, etc.
- EDI version tracking (X12 4010, X12 5010, EDIFACT D-09A)
- Testing schedule management for each message type

### Environment Tracking
- Development, QA, and Production environment management
- Go-live date scheduling and tracking
- Projected timeline calculations

### Calendar & Notifications
- Calendar view for deadlines and important dates
- In-app notification system
- Email notifications for important events

### Reporting & Exports
- CSV data exports
- PDF generation and reports
- Leaderboard for performance tracking

### Notes & Communication
- Project notes and remarks system
- BY remarks for project status updates
- Internal communication tools

## 🛠️ Deployment

### Requirements
- Node.js >= 18.0.0
- npm >= 8.0.0

### Environment Variables
Ensure you set up the following environment variables:
- `VITE_REACT_APP_BASE_URL`: Backend API URL

### Production Build
```bash
npm run build
```
This will create a production build in the `build` directory using Vite's optimized build process.

### Docker Support
The application includes configurations to run in Docker environments with settings for file polling and network access.

## 💻 Local Development

### Frontend Setup
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd PX_V2/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with necessary environment variables:
   ```env
   VITE_REACT_APP_BASE_URL=http://localhost:3001
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd PX_V2/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure your SQL Server connection in the environment variables

4. Start the server:
   ```bash
   node app.js
   ```

## 👥 Features by User Role

- **Admin**: Full access to all features and user management
- **User-PR**: Project management capabilities
- **User-OB**: Onboarding management capabilities
- **View**: Read-only access to data

## 📜 License
Proprietary software. All rights reserved.

