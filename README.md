# Qlik Sense Globe Points Extension

## Overview
The Qlik Sense Globe Points Extension is an interactive 3D globe visualization that allows you to plot geographical data points on a world map. This extension leverages D3.js to create a fully interactive, customizable globe that can display data points based on latitude and longitude coordinates, with support for measure-based styling.

https://github.com/user-attachments/assets/4a20d88c-7858-4141-92b2-42bc13435611


## Features
- Interactive 3D globe with smooth rotation and zoom capabilities
- Plot data points on the globe using latitude/longitude coordinates
- Customize colors for countries, oceans, and data points
- Size points based on fixed values or by measure values
- Color points based on fixed colors or by measure values
- Detailed tooltips with customizable appearance
- Zoom controls with customizable min/max zoom levels
- Automatic globe rotation with adjustable speed
- Country highlighting on hover
- Responsive design that adapts to container dimensions

## Installation

### Qlik Sense Desktop / On-Premises

1. Download the latest release ZIP file 
2. Extract the ZIP file
3. Copy the extracted folder to your Qlik Sense extensions directory:
   - Qlik Sense Desktop: `C:\Users\[USERNAME]\Documents\Qlik\Sense\Extensions\`
   - Qlik Sense Server: Import through the QMC (Qlik Management Console)

### Qlik Sense Cloud

1. Download the latest release ZIP file 
2. Log in to your Qlik Sense Cloud tenant
3. Navigate to the hub and open the app where you want to use the extension
4. Click on "Add new" in the left panel
5. Select "Extension" and then "Upload extension"
6. Choose the downloaded ZIP file and upload
7. The extension will now be available in your app

## Configuration
The extension requires at least 3 dimensions and supports up to 2 optional measures:

### Required Dimensions
1. **Latitude**: Geographical latitude values (numeric)
2. **Longitude**: Geographical longitude values (numeric)
3. **Location Name**: Name or identifier for each location (used in tooltips)

### Optional Measures
1. **Size Measure** (optional): Used when "Size Type" is set to "By Measure"
2. **Color Measure** (optional): Used when "Color Type" is set to "By Measure"

## Properties

### Globe Settings
- **Country Color**: Set the base color for countries
- **Country Hover Color**: Set the color for countries when hovered
- **Ocean Color**: Set the background color for oceans
- **Rotation Speed**: Control the automatic rotation speed (0 = no rotation)

### Point Settings
- **Color Type**: Choose between "Fixed" (single color for all points) or "By Measure" (color determined by the second measure)
- **Point Color**: Set the color for points when using "Fixed" color type
- **Size Type**: Choose between "Fixed" (same size for all points) or "By Measure" (size determined by the first measure)
- **Point Size**: Set the point size when using "Fixed" size type
- **Minimum Point Size**: Set the minimum point size when using "By Measure" size type
- **Maximum Point Size**: Set the maximum point size when using "By Measure" size type

### Tooltip Settings
- **Appearance Settings**: Customize background color, text color, font size, and padding
- **Border Settings**: Enable/disable borders, set border color, width, and radius
- **Shadow Settings**: Enable/disable shadows, set shadow blur and opacity
- **Content Settings**: Configure measure labels and display options

### Zoom Settings
- **Minimum Zoom Scale**: Set the minimum allowed zoom level
- **Maximum Zoom Scale**: Set the maximum allowed zoom level
- **Initial Zoom Level**: Set the default zoom level when the visualization loads
- **Zoom Speed Factor**: Control the zoom speed sensitivity

## Usage Examples

### Basic Example
Configure a basic globe visualization showing location points:

1. Add the extension to your sheet
2. Add three dimensions:
   - Dimension 1: dim_Latitude
   - Dimension 2: dim_Longitude
   - Dimension 3: dim_Name
3. Set Globe Settings according to your preferred color scheme
4. Adjust the rotation speed to your preference

### Advanced Example with Measures
Create a globe visualization showing locations with associated measure data:

1. Add the extension to your sheet
2. Add three dimensions:
   - Dimension 1: dim_Latitude
   - Dimension 2: dim_Longitude
   - Dimension 3: dim_Name
3. Add up to two measures:
   - Measure 1: Sum(Sales) - for point sizing
   - Measure 2: Avg(Profit_Margin) - for point coloring
4. Set Point Settings:
   - Color Type: "By Measure"
   - Size Type: "By Measure"
   - Adjust min/max point sizes
5. Configure tooltip settings to display the measure information

## Interaction
The globe supports the following user interactions:

- **Click and Drag**: Rotate the globe
- **Scroll/Pinch**: Zoom in and out
- **Hover over Points**: Display tooltips with location information and measure values
- **Hover over Countries**: Highlight countries
- **Zoom Controls**: Buttons for zooming in, out, and resetting the view

## Technical Information
This extension is built using:
- D3.js v7 for visualization
- Leverages the Qlik Sense Extension API
- Renders using SVG elements

## Browser Compatibility
- Google Chrome (recommended)
- Mozilla Firefox
- Microsoft Edge
- Safari

## Limitations
- The extension requires at least 3 dimensions (latitude, longitude, and name)
- Very large datasets (>1000 points) may affect performance
- Latitude values must be between -90 and 90
- Longitude values must be between -180 and 180

## Development & Contribution
To contribute to this project:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

For local development:
```bash
# Clone the repository
git clone https://github.com/undsoul/qlik-globe-points.git

# Navigate to the extension directory
cd qlik-globe-points

# Install dependencies
npm install

# Build the extension
npm run build
```

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support
For issues, feature requests, or questions, please [open an issue](https://github.com/undsoul/qlik-globe-points/issues) on the GitHub repository.

## Acknowledgements
- World map data is based on [Natural Earth](https://www.naturalearthdata.com/)
- Built with [D3.js](https://d3js.org/)
- Inspired by [D3 Geo Projections](https://github.com/d3/d3-geo-projection)
