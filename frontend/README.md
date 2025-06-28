# ExcelAnalyzer - Modern SaaS Platform

A sleek, professional Excel analysis platform with a fintech-inspired design featuring dark theme, gradient colors, and modern UI components.

## 🎨 Design Features

- **Dark Theme**: Steel Gray (#1F1C2C) and Gray (#928DAB) color scheme
- **Glassmorphism**: Modern glass cards with backdrop blur effects
- **Smooth Animations**: Framer Motion powered transitions and micro-interactions
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Modern Typography**: Inter and Poppins fonts for optimal readability

## 🚀 Core Features

### 1. Landing Page
- Platform tagline: "Upload. Visualize. Analyze."
- Feature highlights with icons
- Call-to-action buttons
- Statistics showcase
- Smooth scroll animations

### 2. Authentication System
- **Login Page**: Email/password with role selection
- **Signup Page**: Complete registration with security features
- **JWT Visualization**: Visual representation of authentication flow
- **Role-based Access**: User and Admin roles

### 3. User Dashboard
- **File Upload**: Drag & drop Excel file interface
- **Chart Visualization**: Multiple chart types (Line, Bar, Pie, Doughnut, Scatter, 3D)
- **Column Selectors**: X and Y axis configuration
- **Recent Uploads**: History table with file management
- **Export Options**: PNG and PDF download capabilities
- **AI Insights**: Intelligent data analysis and recommendations

### 4. Admin Panel
- **Statistics Cards**: Real-time platform metrics
- **User Management**: Complete user table with actions
- **Search & Filter**: Advanced filtering by role and status
- **User Actions**: Block, delete, and manage user accounts
- **Activity Monitoring**: Track user engagement and platform usage

### 5. Navigation
- **Sidebar Navigation**: Responsive sidebar with smooth animations
- **Profile Management**: User profile dropdown with settings
- **Dark Mode Toggle**: Visual theme switching
- **Role-based Menu**: Dynamic navigation based on user role

## 🛠️ Technology Stack

- **Frontend**: React 19 with Vite
- **Styling**: Tailwind CSS with custom design system
- **Animations**: Framer Motion
- **Charts**: Chart.js with React Chart.js 2
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **3D Graphics**: Three.js (ready for implementation)

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Excel-Analyzer/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## 🎯 Key Components

### LandingPage.jsx
- Hero section with animated tagline
- Feature cards with hover effects
- Statistics showcase
- Call-to-action buttons

### Login.jsx & Signup.jsx
- Form validation and error handling
- Role selection dropdown
- JWT authentication visualization
- Security features display

### Dashboard.jsx
- File upload with drag & drop
- Chart.js integration
- Column selectors for data mapping
- AI insights section
- Export functionality

### AdminPanel.jsx
- Statistics dashboard
- User management table
- Search and filtering
- Action buttons for user management

### Navbar.jsx
- Responsive sidebar navigation
- Profile management
- Dark mode toggle
- Role-based menu items

## 🎨 Design System

### Colors
- **Primary Gray**: #928DAB
- **Steel Gray**: #1F1C2C
- **Glass Light**: rgba(255, 255, 255, 0.1)
- **Glass Dark**: rgba(0, 0, 0, 0.2)

### Typography
- **Primary Font**: Inter
- **Secondary Font**: Poppins
- **Gradient Text**: Custom gradient text effects

### Components
- **Glass Cards**: Backdrop blur with border effects
- **Buttons**: Primary and secondary button styles
- **Input Fields**: Glassmorphism input styling
- **Animations**: Smooth transitions and hover effects

## 🔧 Customization

### Adding New Chart Types
1. Import new chart component from Chart.js
2. Add to `chartTypes` array in Dashboard.jsx
3. Implement rendering logic in `renderChart()` function

### Modifying Colors
1. Update color values in `tailwind.config.js`
2. Modify CSS custom properties in `index.css`
3. Update component-specific color classes

### Adding New Features
1. Create new component in `src/components/`
2. Add routing in `App.jsx`
3. Update navigation in `Navbar.jsx`

## 📱 Responsive Design

The platform is fully responsive with breakpoints:
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## 🚀 Performance Features

- **Code Splitting**: Automatic route-based code splitting
- **Lazy Loading**: Components load on demand
- **Optimized Animations**: Hardware-accelerated animations
- **Efficient Rendering**: React optimization techniques

## 🔒 Security Features

- **JWT Authentication**: Token-based authentication
- **Role-based Access**: User and admin permissions
- **Secure File Upload**: File type validation
- **Input Validation**: Form validation and sanitization

## 📈 Future Enhancements

- [ ] Real-time data synchronization
- [ ] Advanced 3D chart visualizations
- [ ] Collaborative features
- [ ] Advanced AI insights
- [ ] Mobile app development
- [ ] API integration with backend

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Built with ❤️ using modern web technologies**
