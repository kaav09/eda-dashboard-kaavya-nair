# eda-dashboard-kaavya-nair
A full-stack Exploratory Data Analysis (EDA) web application using React and Django for easy and interactive data visualisation.

The goal was to build an interactive Exploratory Data Analysis (EDA) dashboard where users can dynamically explore sales data using multiple filters (channel, brand, pack type, etc.) and visualize insights across time periods.
The focus was on combining clean UI, real-time interactivity, and modular data flow to simulate the analytical experience of tools like Tableau or Power BI, but within a web environment.

- Each chart (bar, line, etc.) and filter panel is a standalone React component, enabling easy maintenance and scalability.
- Filters in the sidebar update backend queries via REST API calls, ensuring only relevant data is fetched and rendered.
- Backend endpoints were optimized for grouped aggregations (e.g., year-wise, brand-wise sales) to reduce frontend computation.
- Addition filter - Month was added to see granular visualisation of monthwise breakdowns.
- An export PDF button is also available to capture snapshots of the state of the dashbaord in real time for easy and convenient analysis.
