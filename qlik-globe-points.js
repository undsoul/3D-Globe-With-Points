/**
 * Qlik Globe Points Visualization
 * Part 1: Core Definition and Helper Functions
 */
define(['qlik', 'jquery', 'text!./globeCoordinates.json', './d3.v7'], function(qlik, $, worldJson, d3) {
    'use strict';

    // Parse the world coordinates data
    const worldData = JSON.parse(worldJson);
    
    // Global state variables
    let isDragging = false;
    let isAnimating = false; 
    let transformRef = { current: null };
    let zoomControl = null;
    let rotationTimer = null;
    
    // Add CSS styles for the extension
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .qv-extension-qlik-globe {
            width: 100%;
            height: 100%;
            min-height: 400px;
            position: relative;
            overflow: hidden;
        }
        .qv-extension-qlik-globe svg {
            width: 100%;
            height: 100%;
            display: block;
        }
        .zoom-button {
            padding: 8px;
            width: 40px;
            height: 40px;
            border: 1px solid #ccc;
            border-radius: 4px;
            background: white;
            cursor: pointer;
            font-size: 20px;
            transition: all 0.2s ease;
        }
        .zoom-button:active {
            background-color: #e6e6e6 !important;
            transform: scale(0.95);
        }
        .zoom-controls {
            position: absolute;
            bottom: 20px;
            left: 20px;
            display: flex;
            flex-direction: column;
            gap: 5px;
            touch-action: none;
            user-select: none;
        }
        .zoom-indicator {
            text-align: center;
            margin: 5px 0;
            font-size: 12px;
            color: #333;
        }
        .globe-tooltip {
            pointer-events: none;
            transition: opacity 0.2s ease;
            z-index: 999;
            position: absolute;
        }
    `;
    document.head.appendChild(styleElement);

    // Helper function to get color value from either string or object
    function getColor(colorObj, defaultColor) {
        if (colorObj && typeof colorObj === 'object' && colorObj.color) {
            return colorObj.color;
        } else if (typeof colorObj === 'string') {
            return colorObj;
        }
        return defaultColor;
    }

    // Helper function to check point visibility based on projection
    function isPointVisible(d, projection) {
        const rotate = projection.rotate();
        const longitude = d.longitude + rotate[0];
        const latitude = d.latitude + rotate[1];
        return Math.cos(latitude * Math.PI / 180) * 
               Math.cos(longitude * Math.PI / 180) > 0;
    }

    // Helper function to convert color to rgba
    function colorWithOpacity(color, opacity) {
        if (!color) return null;
        
        // If already rgba format
        if (color.startsWith('rgba')) {
            return color.replace(/[\d\.]+(?=\))/, opacity);
        }
        
        // If rgb format
        if (color.startsWith('rgb')) {
            return color.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
        }
        
        // If hex format
        if (color.startsWith('#')) {
            let r = parseInt(color.slice(1, 3), 16);
            let g = parseInt(color.slice(3, 5), 16);
            let b = parseInt(color.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        }
        
        // Default fallback
        return color;
    }

    // Extension definition starts here
    let extensionDefinition = {
        initialProperties: {
            qHyperCubeDef: {
                qDimensions: [],
                qMeasures: [],
                qInitialDataFetch: [{
                    qWidth: 5,
                    qHeight: 1000
                }]
            },
            props: {
                rotationSpeed: 20,
                countryColor: {
                    color: "#d4dadc",
                    index: -1
                },
                oceanColor: {
                    color: "#ffffff",
                    index: -1
                },
                pointColor: {
                    color: "#008936",
                    index: -1
                },
                countryHoverColor: {
                    color: "#b8bfc2",
                    index: -1
                },
                pointSize: 3,
                minPointSize: 2,
                maxPointSize: 10,
                sizeType: "fixed",
                // Zoom properties
                minZoomScale: 0.5,
                maxZoomScale: 2.5,
                initialZoom: 1.25,
                zoomSpeed: 1.2,
                // Tooltip properties
                tooltipBackgroundColor: {
                    color: "#ffffff",
                    index: -1
                },
                tooltipBackgroundOpacity: 1.0,
                tooltipFontColor: {
                    color: "#19426C",
                    index: -1
                },
                tooltipBorderEnabled: true,
                tooltipBorderColor: {
                    color: "#ffffff",
                    index: -1
                },
                tooltipBorderWidth: 1,
                tooltipBorderRadius: 4,
                tooltipPadding: 8,
                tooltipFontSize: 14,
                tooltipShadowEnabled: true,
                tooltipShadowBlur: 4,
                tooltipShadowOpacity: 0.2,
                tooltipShowMeasureLabel: true,
                tooltipMeasureLabel: "Value"
            }
        },
        /**
 * Qlik Globe Points Visualization
 * Part 2: Property Panel Definition
 */
        definition: {
            type: "items",
            component: "accordion",
            items: {
                dimensions: {
                    uses: "dimensions",
                    min: 3,
                    max: 3
                },
                measures: {
                    uses: "measures",
                    min: 0,
                    max: 2
                },
                settings: {
                    uses: "settings",
                    items: {
                        globeSettings: {
                            label: "Globe Settings",
                            type: "items",
                            items: {
                                countryColor: {
                                    label: "Country Color",
                                    component: "color-picker",
                                    ref: "props.countryColor",
                                    type: "object",
                                    defaultValue: {
                                        index: -1,
                                        color: "#d4dadc"
                                    }
                                },
                                countryHoverColor: {
                                    label: "Country Hover Color",
                                    component: "color-picker",
                                    ref: "props.countryHoverColor",
                                    type: "object",
                                    defaultValue: {
                                        index: -1,
                                        color: "#b8bfc2"
                                    }
                                },
                                oceanColor: {
                                    label: "Ocean Color",
                                    component: "color-picker",
                                    ref: "props.oceanColor",
                                    type: "object",
                                    defaultValue: {
                                        index: -1,
                                        color: "#e6f3ff"
                                    }
                                },
                                rotationSpeed: {
                                    ref: "props.rotationSpeed",
                                    label: "Rotation Speed",
                                    type: "number",
                                    component: "slider",
                                    min: 0,
                                    max: 100,
                                    step: 5,
                                    defaultValue: 20
                                }
                            }
                        },
                        pointSettings: {
                            label: "Point Settings",
                            type: "items",
                            items: {
                                pointColor: {
                                    label: "Point Color",
                                    component: "color-picker",
                                    ref: "props.pointColor",
                                    type: "object",
                                    defaultValue: {
                                        index: -1,
                                        color: "#008936"
                                    }
                                },
                                sizeSettings: {
                                    label: "Size Settings",
                                    type: "items",
                                    items: {
                                        sizeType: {
                                            ref: "props.sizeType",
                                            label: "Point Size Type",
                                            type: "string",
                                            component: "buttongroup",
                                            options: [{
                                                value: "fixed",
                                                label: "Fixed"
                                            }, {
                                                value: "measure",
                                                label: "By Measure"
                                            }],
                                            defaultValue: "fixed"
                                        },
                                        pointSize: {
                                            ref: "props.pointSize",
                                            label: "Point Size",
                                            type: "number",
                                            component: "slider",
                                            min: 1,
                                            max: 10,
                                            step: 1,
                                            defaultValue: 3,
                                            show: function(data) {
                                                return data.props.sizeType === "fixed";
                                            }
                                        },
                                        minPointSize: {
                                            ref: "props.minPointSize",
                                            label: "Minimum Point Size",
                                            type: "number",
                                            component: "slider",
                                            min: 1,
                                            max: 10,
                                            step: 1,
                                            defaultValue: 2,
                                            show: function(data) {
                                                return data.props.sizeType === "measure";
                                            }
                                        },
                                        maxPointSize: {
                                            ref: "props.maxPointSize",
                                            label: "Maximum Point Size",
                                            type: "number",
                                            component: "slider",
                                            min: 1,
                                            max: 20,
                                            step: 1,
                                            defaultValue: 10,
                                            show: function(data) {
                                                return data.props.sizeType === "measure";
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        /**
 * Qlik Globe Points Visualization
 * Part 3: Tooltip and Zoom Settings
 */
                        tooltipSettings: {
                            label: "Tooltip Settings",
                            type: "items",
                            items: {
                                appearanceSection: {
                                    label: "Appearance",
                                    type: "items",
                                    items: {
                                        tooltipBackgroundColor: {
                                            label: "Background Color",
                                            component: "color-picker",
                                            ref: "props.tooltipBackgroundColor",
                                            type: "object",
                                            defaultValue: {
                                                index: -1,
                                                color: "#ffffff"
                                            }
                                        },
                                        tooltipBackgroundOpacity: {
                                            ref: "props.tooltipBackgroundOpacity",
                                            label: "Background Opacity",
                                            type: "number",
                                            component: "slider",
                                            min: 0,
                                            max: 1,
                                            step: 0.1,
                                            defaultValue: 1.0
                                        },
                                        tooltipFontColor: {
                                            label: "Font Color",
                                            component: "color-picker",
                                            ref: "props.tooltipFontColor",
                                            type: "object",
                                            defaultValue: {
                                                index: -1,
                                                color: "#19426C"
                                            }
                                        },
                                        tooltipFontSize: {
                                            ref: "props.tooltipFontSize",
                                            label: "Font Size",
                                            type: "number",
                                            component: "slider",
                                            min: 10,
                                            max: 20,
                                            step: 1,
                                            defaultValue: 14
                                        },
                                        tooltipPadding: {
                                            ref: "props.tooltipPadding",
                                            label: "Padding",
                                            type: "number",
                                            component: "slider",
                                            min: 0,
                                            max: 20,
                                            step: 1,
                                            defaultValue: 8
                                        }
                                    }
                                },
                                borderSection: {
                                    label: "Border",
                                    type: "items",
                                    items: {
                                        tooltipBorderEnabled: {
                                            ref: "props.tooltipBorderEnabled",
                                            label: "Enable Border",
                                            type: "boolean",
                                            defaultValue: true
                                        },
                                        tooltipBorderColor: {
                                            label: "Border Color",
                                            component: "color-picker",
                                            ref: "props.tooltipBorderColor",
                                            type: "object",
                                            defaultValue: {
                                                index: -1,
                                                color: "#FFFFFF"
                                            },
                                            show: function(data) {
                                                return data.props.tooltipBorderEnabled;
                                            }
                                        },
                                        tooltipBorderWidth: {
                                            ref: "props.tooltipBorderWidth",
                                            label: "Border Width",
                                            type: "number",
                                            component: "slider",
                                            min: 1,
                                            max: 5,
                                            step: 1,
                                            defaultValue: 1,
                                            show: function(data) {
                                                return data.props.tooltipBorderEnabled;
                                            }
                                        },
                                        tooltipBorderRadius: {
                                            ref: "props.tooltipBorderRadius",
                                            label: "Border Radius",
                                            type: "number",
                                            component: "slider",
                                            min: 0,
                                            max: 15,
                                            step: 1,
                                            defaultValue: 4
                                        }
                                    }
                                },
                                /**
 * Qlik Globe Points Visualization
 * Part 4: Shadow, Content, and Zoom Settings
 */
                                shadowSection: {
                                    label: "Shadow",
                                    type: "items",
                                    items: {
                                        tooltipShadowEnabled: {
                                            ref: "props.tooltipShadowEnabled",
                                            label: "Enable Shadow",
                                            type: "boolean",
                                            defaultValue: true
                                        },
                                        tooltipShadowBlur: {
                                            ref: "props.tooltipShadowBlur",
                                            label: "Shadow Blur",
                                            type: "number",
                                            component: "slider",
                                            min: 0,
                                            max: 20,
                                            step: 1,
                                            defaultValue: 4,
                                            show: function(data) {
                                                return data.props.tooltipShadowEnabled;
                                            }
                                        },
                                        tooltipShadowOpacity: {
                                            ref: "props.tooltipShadowOpacity",
                                            label: "Shadow Opacity",
                                            type: "number",
                                            component: "slider",
                                            min: 0,
                                            max: 1,
                                            step: 0.1,
                                            defaultValue: 0.2,
                                            show: function(data) {
                                                return data.props.tooltipShadowEnabled;
                                            }
                                        }
                                    }
                                },
                                contentSection: {
                                    label: "Content",
                                    type: "items",
                                    items: {
                                        tooltipShowMeasureLabel: {
                                            ref: "props.tooltipShowMeasureLabel",
                                            label: "Show Measure Label",
                                            type: "boolean",
                                            defaultValue: true
                                        },
                                        tooltipMeasureLabel: {
                                            ref: "props.tooltipMeasureLabel",
                                            label: "Measure Label Text",
                                            type: "string",
                                            defaultValue: "Value",
                                            show: function(data) {
                                                return data.props.tooltipShowMeasureLabel;
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        zoomSettings: {
                            label: "Zoom Settings",
                            type: "items",
                            items: {
                                minZoomScale: {
                                    ref: "props.minZoomScale",
                                    label: "Minimum Zoom Scale",
                                    type: "number",
                                    component: "slider",
                                    min: 0.1,
                                    max: 1,
                                    step: 0.1,
                                    defaultValue: 0.5
                                },
                                maxZoomScale: {
                                    ref: "props.maxZoomScale",
                                    label: "Maximum Zoom Scale",
                                    type: "number",
                                    component: "slider",
                                    min: 1,
                                    max: 10,
                                    step: 0.5,
                                    defaultValue: 2.5
                                },
                                initialZoom: {
                                    ref: "props.initialZoom",
                                    label: "Initial Zoom Level",
                                    type: "number",
                                    component: "slider",
                                    min: 0.5,
                                    max: 2.5,
                                    step: 0.1,
                                    defaultValue: 1.25
                                },
                                zoomSpeed: {
                                    ref: "props.zoomSpeed",
                                    label: "Zoom Speed Factor",
                                    type: "number",
                                    component: "slider",
                                    min: 1.1,
                                    max: 2,
                                    step: 0.1,
                                    defaultValue: 1.2
                                }
                            }
                        }
                    }
                }
            }
        },
        
        // Additional module components will be included in subsequent parts
        /**
 * Qlik Globe Points Visualization
 * Part 5: Paint Function Initialization
 */
        // Core visualization function
        paint: function($element, layout) {
            try {
                // Get properties from layout
                const props = layout.props;
                const rotationSpeed = props.rotationSpeed / 1000;
                
                // Clear the element and create container
                const $container = $element.empty().append(`
                    <div class="qv-extension-qlik-globe">
                        <div id="globe-container-${layout.qInfo.qId}"></div>
                    </div>
                `);

                // Process and format data from HyperCube
                const data = layout.qHyperCube.qDataPages[0].qMatrix.map(row => ({
                    latitude: parseFloat(row[0].qNum),
                    longitude: parseFloat(row[1].qNum),
                    name: row[2].qText,
                    sizeValue: row[3] ? row[3].qNum : null,
                    colorValue: row[4] ? row[4].qNum : null
                })).filter(d => !isNaN(d.latitude) && !isNaN(d.longitude));

                // Calculate container dimensions and globe radius
                const container = document.getElementById(`globe-container-${layout.qInfo.qId}`);
                const width = $container.width();
                const height = $container.height();
                const radius = Math.min(width, height) / 2.5;

                // Define zoom scales based on properties
                const minScale = radius * (props.minZoomScale || 0.5);
                const maxScale = radius * (props.maxZoomScale || 2.5);
                const defaultScale = radius * (props.initialZoom || 1.25);

                // Clear any existing SVG
                d3.select(container).selectAll("svg").remove();

                // Create new SVG
                const svg = d3.select(container)
                    .append("svg")
                    .attr("width", width)
                    .attr("height", height);

                // Setup projection and path generator
                const projection = d3.geoOrthographic()
                    .scale(defaultScale)
                    .translate([width/2, height/2])
                    .center([0, 0])
                    .rotate([0, -25, 0]);

                const path = d3.geoPath()
                    .projection(projection);

                // Calculate size scale if using measure
                let sizeScale;
                if (props.sizeType === "measure") {
                    const sizeExtent = d3.extent(data, d => d.sizeValue);
                    sizeScale = d3.scaleLinear()
                        .domain(sizeExtent)
                        .range([props.minPointSize || 2, props.maxPointSize || 10]);
                }

                // Draw ocean
                svg.append("circle")
                    .attr("cx", width/2)
                    .attr("cy", height/2)
                    .attr("r", defaultScale)
                    .attr("class", "ocean")
                    .attr("fill", getColor(props.oceanColor, "#e6f3ff"));

                // Draw countries
                const countries = svg.append("g")
                    .attr("class", "countries")
                    .selectAll("path")
                    .data(worldData.features)
                    .enter()
                    .append("path")
                    .attr("class", "country")
                    .attr("fill", getColor(props.countryColor, "#d4dadc"))
                    .attr("stroke", "#999")
                    .attr("stroke-width", 0.5)
                    .attr("d", path)
                    .on("mouseover", function() {
                        d3.select(this)
                            .attr("fill", getColor(props.countryHoverColor, "#b8bfc2"));
                    })
                    .on("mouseout", function() {
                        d3.select(this)
                            .attr("fill", getColor(props.countryColor, "#d4dadc"));
                    });

                // Add globe outline
                svg.append("circle")
                    .attr("cx", width/2)
                    .attr("cy", height/2)
                    .attr("r", defaultScale)
                    .attr("class", "outline")
                    .attr("fill", "none")
                    .attr("stroke", "#000")
                    .attr("stroke-width", 0.25);

                /**
                 * Qlik Globe Points Visualization
                 * Part 6: Points and Tooltips
                 */
                // Add location points with visibility check
                const dots = svg.selectAll("circle.location")
                    .data(data)
                    .enter()
                    .append("circle")
                    .attr("class", "location")
                    .attr("r", d => {
                        if (props.sizeType === "measure" && d.sizeValue !== null) {
                            return sizeScale(d.sizeValue);
                        }
                        return props.pointSize;
                    })
                    .attr("fill", getColor(props.pointColor, "#008936"));

                // Create tooltip with custom background opacity
                // First remove any existing tooltips
                d3.select("#globe-tooltip-" + layout.qInfo.qId).remove();
                
                // Create tooltip styles object with background opacity
                const tooltipStyles = {
                    "background-color": function() {
                        const color = getColor(props.tooltipBackgroundColor, "#ffffff");
                        const opacity = props.tooltipBackgroundOpacity !== undefined ? 
                            props.tooltipBackgroundOpacity : 1.0;
                        return colorWithOpacity(color, opacity);
                    }(),
                    "color": getColor(props.tooltipFontColor, "#19426C"),
                    "border": props.tooltipBorderEnabled ? 
                        `${props.tooltipBorderWidth || 1}px solid ${getColor(props.tooltipBorderColor, "#FFFFFF")}` : 
                        "none",
                    "border-radius": `${props.tooltipBorderRadius !== undefined ? props.tooltipBorderRadius : 4}px`,
                    "padding": `${props.tooltipPadding || 8}px`,
                    "font-size": `${props.tooltipFontSize || 14}px`,
                    "box-shadow": props.tooltipShadowEnabled ? 
                        `0 2px ${props.tooltipShadowBlur || 4}px rgba(0,0,0,${props.tooltipShadowOpacity || 0.2})` : 
                        "none",
                    "pointer-events": "none",
                    "transition": "opacity 0.2s ease",
                    "z-index": "999",
                    "position": "absolute"
                };
                
                const tooltip = d3.select("body").append("div")
                    .attr("id", "globe-tooltip-" + layout.qInfo.qId)
                    .attr("class", "globe-tooltip")
                    .style("opacity", 0);
                
                // Apply all custom tooltip styles
                Object.entries(tooltipStyles).forEach(([property, value]) => {
                    tooltip.style(property, value);
                });

                // Function to update point positions and visibility
                function update() {
                    countries.attr("d", path);
                    
                    dots.each(function(d) {
                        const point = projection([d.longitude, d.latitude]);
                        if (point) {
                            const [x, y] = point;
                            if (!isNaN(x) && !isNaN(y)) {
                                const visible = isPointVisible(d, projection);
                                d3.select(this)
                                    .attr("transform", `translate(${x},${y})`)
                                    .style("display", visible ? null : "none");
                            }
                        }
                    });
                }
                
                // Setup tooltip events with enhanced interaction and customized content
                dots.on("mouseover", function(event, d) {
                    const currentSize = props.sizeType === "measure" ? 
                        sizeScale(d.sizeValue) : props.pointSize;
                        
                    d3.select(this)
                        .transition()
                        .duration(200)
                        .attr("r", currentSize * 1.5);
                    
                    // Format tooltip content based on settings
                    let tooltipContent = `<div style="font-weight: bold;">${d.name}</div>`;
                    
                    // Add measure value with custom label if configured
                    if (d.sizeValue !== null && props.tooltipShowMeasureLabel) {
                        const measureLabel = props.tooltipMeasureLabel || 'Value';
                        tooltipContent += `<div>${measureLabel}: ${d.sizeValue.toLocaleString()}</div>`;
                    } else if (d.sizeValue !== null) {
                        tooltipContent += `<div>${d.sizeValue.toLocaleString()}</div>`;
                    }
                    
                    // Add color value if present
                    if (d.colorValue !== null) {
                        tooltipContent += `<div>Color: ${d.colorValue.toLocaleString()}</div>`;
                    }
                    
                    tooltip.transition()
                        .duration(200)
                        .style("opacity", 0.9);
                        
                    tooltip.html(tooltipContent)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 10) + "px");
                })
                .on("mouseout", function(event, d) {
                    const currentSize = props.sizeType === "measure" ? 
                        sizeScale(d.sizeValue) : props.pointSize;
                        
                    d3.select(this)
                        .transition()
                        .duration(200)
                        .attr("r", currentSize);
                        
                    tooltip.transition()
                        .duration(500)
                        .style("opacity", 0);
                });

// End of Part 6
                /**
 * Qlik Globe Points Visualization
 * Part 7: Zoom Controls
 */
                // Add zoom controls container
                const zoomControls = d3.select(`#globe-container-${layout.qInfo.qId}`)
                    .append("div")
                    .attr("class", "zoom-controls")
                    .style("touch-action", "none");

                // Add zoom in button
                zoomControls.append("button")
                    .attr("class", "zoom-button")
                    .html("&plus;")
                    .on("click", () => {
                        const zoomSpeed = props.zoomSpeed || 1.2;
                        zoomGlobe(zoomSpeed);
                    });

                // Add reset view button
                zoomControls.append("button")
                    .attr("class", "zoom-button")
                    .style("font-size", "18px")
                    .html(`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>`)
                    .on("click", resetView);

                // Add zoom out button
                zoomControls.append("button")
                    .attr("class", "zoom-button")
                    .html("&minus;")
                    .on("click", () => {
                        const zoomSpeed = props.zoomSpeed || 1.2;
                        zoomGlobe(1/zoomSpeed);
                    });

                // Add zoom percentage indicator
                const zoomIndicator = zoomControls
                    .append("div")
                    .attr("class", "zoom-indicator");

                // Function to update zoom indicator
                function updateZoomIndicator(scale) {
                    const percentage = Math.round((scale / radius) * 100);
                    zoomIndicator.text(`${percentage}%`);
                }

                // Function to handle zoom interactions
                function zoomGlobe(factor) {
                    // Ensure we have a valid transform reference
                    if (!transformRef.current) {
                        transformRef.current = d3.zoomIdentity.scale(props.initialZoom || 1.25);
                    }
                    
                    // Calculate the new scale factor
                    const newK = transformRef.current.k * factor;
                    
                    // Create a new transform with the updated scale
                    const newTransform = d3.zoomIdentity.scale(
                        Math.max(
                            props.minZoomScale || 0.5, 
                            Math.min(props.maxZoomScale || 2.5, newK)
                        )
                    );
                    
                    // Apply the transform directly
                    const newScale = defaultScale * newTransform.k;
                    const constrainedScale = Math.max(minScale, Math.min(maxScale, newScale));
                    
                    // Apply with transition
                    svg.transition()
                        .duration(250)
                        .tween("zoom", function() {
                            const i = d3.interpolate(projection.scale(), constrainedScale);
                            return function(t) {
                                projection.scale(i(t));
                                d3.select("circle.ocean").attr("r", i(t));
                                d3.select("circle.outline").attr("r", i(t));
                                update();
                                updateZoomIndicator(i(t));
                            };
                        })
                        .on("end", function() {
                            transformRef.current = newTransform;
                            zoomControl.scale = constrainedScale;
                        });
                }

                // Fixed function to reset view (rotation and zoom)
                function resetView() {
                    const initialRotation = [0, -25, 0];
                    const initialZoomScale = props.initialZoom || 1.25;
                    const initialScale = defaultScale * initialZoomScale;
                    
                    isAnimating = true;
                    
                    // Stop rotation during animation
                    if (rotationTimer) rotationTimer.stop();
                    
                    // Reset rotation with a smooth transition
                    d3.transition()
                        .duration(1000)
                        .ease(d3.easeCubicInOut)
                        .tween("reset", () => {
                            const currentRotation = projection.rotate();
                            const currentScale = projection.scale();
                            
                            const rotationInterpolator = d3.interpolate(currentRotation, initialRotation);
                            const scaleInterpolator = d3.interpolate(currentScale, initialScale);
                            
                            return t => {
                                projection.rotate(rotationInterpolator(t));
                                projection.scale(scaleInterpolator(t));
                                
                                d3.select("circle.ocean").attr("r", scaleInterpolator(t));
                                d3.select("circle.outline").attr("r", scaleInterpolator(t));
                                
                                update();
                                updateZoomIndicator(scaleInterpolator(t));
                            };
                        })
                        .on("end", () => {
                            isAnimating = false;
                            transformRef.current = d3.zoomIdentity.scale(initialZoomScale);
                            
                            // Restart rotation if enabled
                            if (props.rotationSpeed > 0) {
                                startRotation();
                            }
                        });
                }

// End of Part 7
                /**
 * Qlik Globe Points Visualization
 * Part 8: Interactions
 */
                // Setup combined zoom and drag interactions - fixed to work properly
                // Replace the setupInteractions function with this balanced version:

                /**
                 * Complete overhaul of the setupInteractions function
                 * This focuses on reliable, simple implementation of both zoom and drag
                 */
                function setupInteractions() {
                    // Clear existing event handlers to prevent conflicts
                    svg.on(".zoom", null);
                    svg.on(".drag", null);
                    countries.on(".drag", null);
                    d3.select("circle.ocean").on(".drag", null);
                    
                    // Mouse wheel zoom implementation
                    svg.on("wheel", function(event) {
                        // Prevent default scroll behavior
                        event.preventDefault();
                        
                        // Direction and scaling
                        const direction = event.deltaY < 0 ? 1 : -1;
                        const factor = direction > 0 ? 1.1 : 0.9;
                        
                        // Get current scale
                        const currentScale = projection.scale();
                        
                        // Calculate new scale with constraints
                        const newScale = Math.max(
                            minScale,
                            Math.min(maxScale, currentScale * factor)
                        );
                        
                        // Update projection with new scale
                        projection.scale(newScale);
                        
                        // Update globe elements
                        d3.select("circle.ocean").attr("r", newScale);
                        d3.select("circle.outline").attr("r", newScale);
                        
                        // Update visualization
                        update();
                        updateZoomIndicator(newScale);
                    });
                    
                    // Direct mouse drag implementation
                    let isDragging = false;
                    let previousMousePosition = null;
                    
                    svg.on("mousedown", function(event) {
                        // Only allow primary button (left-click)
                        if (event.button !== 0) return;
                        
                        // Check if click is inside the globe radius
                        const mouse = d3.pointer(event, this);
                        const centerX = width / 2;
                        const centerY = height / 2;
                        const distance = Math.sqrt(
                            Math.pow(mouse[0] - centerX, 2) + 
                            Math.pow(mouse[1] - centerY, 2)
                        );
                        
                        // Only start drag if inside the globe
                        if (distance <= projection.scale()) {
                            isDragging = true;
                            previousMousePosition = mouse;
                            
                            // Stop rotation
                            if (rotationTimer) rotationTimer.stop();
                            
                            // Capture mouse move and up events on window
                            d3.select(window)
                                .on("mousemove.globeDrag", handleMouseMove)
                                .on("mouseup.globeDrag", handleMouseUp);
                        }
                    });
                    
                    function handleMouseMove(event) {
                        if (!isDragging) return;
                        
                        const mouse = d3.pointer(event, svg.node());
                        
                        if (previousMousePosition) {
                            // Calculate movement
                            const dx = mouse[0] - previousMousePosition[0];
                            const dy = mouse[1] - previousMousePosition[1];
                            
                            // Get current rotation
                            const rotation = projection.rotate();
                            
                            // Apply rotation with sensitivity scaling
                            // Lower number = less sensitive
                            const sensitivity = 0.3;
                            
                            projection.rotate([
                                rotation[0] + dx * sensitivity,
                                Math.max(-90, Math.min(90, rotation[1] - dy * sensitivity)),
                                rotation[2]
                            ]);
                            
                            // Update visualization
                            update();
                        }
                        
                        // Update previous position
                        previousMousePosition = mouse;
                    }
                    
                    function handleMouseUp() {
                        isDragging = false;
                        previousMousePosition = null;
                        
                        // Remove event listeners
                        d3.select(window)
                            .on("mousemove.globeDrag", null)
                            .on("mouseup.globeDrag", null);
                        
                        // Restart rotation if enabled
                        if (props.rotationSpeed > 0 && !isAnimating) {
                            startRotation();
                        }
                    }
                    
                    // Update the zoom controls to work correctly
                    // with our direct implementation
                    zoomControl = {
                        scale: projection.scale(),
                        transform: function(selection, transform) {
                            const newScale = defaultScale * transform.k;
                            const constrainedScale = Math.max(minScale, Math.min(maxScale, newScale));
                            
                            projection.scale(constrainedScale);
                            zoomControl.scale = constrainedScale;
                            
                            d3.select("circle.ocean").attr("r", constrainedScale);
                            d3.select("circle.outline").attr("r", constrainedScale);
                            
                            update();
                            updateZoomIndicator(constrainedScale);
                            
                            // Store the transform for reference
                            transformRef.current = transform;
                        }
                    };
                    
                    // Initialize the transform reference
                    const initialZoomScale = props.initialZoom || 1.25;
                    transformRef.current = d3.zoomIdentity.scale(initialZoomScale);
                    
                    return {
                        zoomControl: zoomControl
                    };
                }

                // Auto-rotation function - improved to work with interactions
                function startRotation() {
                    if (rotationTimer) rotationTimer.stop();
                    
                    if (props.rotationSpeed > 0 && !isDragging && !isAnimating) {
                        let lastTime = Date.now();
                        rotationTimer = d3.timer(function() {
                            if (isDragging || isAnimating) return;
                            
                            const currentTime = Date.now();
                            const elapsed = currentTime - lastTime;
                            lastTime = currentTime;
                
                            const rotation = projection.rotate();
                            projection.rotate([
                                rotation[0] + elapsed * rotationSpeed,
                                rotation[1],
                                rotation[2]
                            ]);
                            
                            update();
                        });
                    }
                }

// End of Part 8
                /**
 * Qlik Globe Points Visualization
 * Part 9: Finalization
 */
                // Initialize interactions
                setupInteractions();
                
                // Initial update and indicators
                update();
                updateZoomIndicator(defaultScale);
                
                // Start rotation if enabled
                startRotation();

                // Add cleanup
                $element.on('$destroy', function() {
                    if (rotationTimer) rotationTimer.stop();
                    d3.select("#globe-tooltip-" + layout.qInfo.qId).remove();
                    svg.on(".zoom", null)
                       .on(".drag", null);
                });

            } catch (err) {
                console.error('Error in globe visualization:', err);
            }

            return qlik.Promise.resolve();
        },

        // Additional methods for extension
        resize: function($element, layout) {
            // Simply redraw the entire visualization when resized
            this.paint($element, layout);
        },
        
        // Support capabilities
        support: {
            snapshot: true,
            export: true,
            exportData: true
        }
    };

    // Return the extension definition
    return extensionDefinition;
});

// End of Part 9
