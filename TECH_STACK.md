# Tech Stack - EDA Dashboard Project

## Project Overview
A full-stack exploratory data analysis (EDA) dashboard for FMCG (Fast Moving Consumer Goods) sales and volume data with interactive visualizations, filtering capabilities, and PDF export functionality.

## Backend Stack

### Framework & Core
- **Django 5.2.7** - Python web framework for RESTful API
- **Python** - Backend programming language

### Data Processing
- **Pandas 2.2.2** - Data manipulation and analysis library for processing CSV datasets

### API & CORS
- **django-cors-headers 4.7.0** - Cross-Origin Resource Sharing (CORS) middleware for Django

### Database
- **SQLite3** - Lightweight relational database (default Django DB)

### API Endpoints
- `/api/filters/` - Returns available filter options (brands, channels, ppgs, etc.)
- `/api/chart-data/` - Returns aggregated data for visualizations with query parameters

## Frontend Stack

### Framework & Core
- **React 19.2.0** - JavaScript library for building user interfaces
- **React DOM 19.2.0** - React renderer for the web
- **react-scripts 5.0.1** - Build tools and configuration for Create React App

### Data Visualization
- **Recharts 2.10.3** - Composable charting library built on React and D3
  - Bar charts (horizontal & vertical)
  - Line charts
  - Pie charts

### UI Components
- **react-select 5.8.0** - Flexible and customizable select component with multi-select support
- **@dnd-kit/core 6.3.1** - Modern drag and drop toolkit (Core)
- **@dnd-kit/sortable 10.0.0** - Sortable list components
- **@dnd-kit/utilities 3.2.2** - Utility functions for drag and drop operations

### HTTP Client
- **Axios 1.6.0** - Promise-based HTTP client for API communication

### Export Functionality
- **react-to-pdf 2.0.1** - Generate PDF exports from React components

### Testing
- **@testing-library/react 16.3.0** - React component testing utilities
- **@testing-library/jest-dom 6.9.1** - Custom jest matchers for DOM elements
- **@testing-library/user-event 13.5.0** - User interaction simulation
- **@testing-library/dom 10.4.1** - DOM testing utilities

### Build Tools
- **Webpack** - Module bundler (via react-scripts)
- **Babel** - JavaScript compiler (via react-scripts)

## Data Source
- **CSV Dataset**: `dashboard/data/fmcg_dataset.csv` - FMCG sales and volume data

## Architecture Pattern
- **RESTful API** - Django serves as backend API
- **Component-based** - React frontend with reusable components
- **Single Page Application (SPA)** - React handles client-side routing and state

## Development Workflow

### Backend
- Server runs on: `http://127.0.0.1:8000`
- Hot reload enabled with Django StatReloader
- File-based database (SQLite) for easy setup

### Frontend
- Development server: `http://localhost:3000`
- Hot module replacement for instant updates
- Modern ES6+ JavaScript with JSX

## Key Features Implemented
1. **Interactive Filtering** - Multi-select filters for brands, channels, PPGs, years, months
2. **Dynamic Visualizations** - Real-time chart updates based on filter selection
3. **Drag & Drop** - Reorderable chart components using @dnd-kit
4. **PDF Export** - Download dashboard as PDF report
5. **Responsive Design** - Mobile-friendly layout with CSS Grid and Flexbox
6. **Real-time Data** - Live API calls with Axios for instant data updates

## Deployment
- **Development**: Django development server + React development server
- **Production Ready**: Can be containerized with Docker, deployed to cloud platforms

## Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Modern browsers supporting ES6+


