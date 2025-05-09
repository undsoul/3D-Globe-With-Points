define(['qlik', 'jquery', 'text!./globeCoordinates.json', './d3.v7'], function(qlik, $, worldJson, d3) {
    'use strict';

    const worldData = JSON.parse(worldJson);
    let lastK = 2; // Initial Zoom

    // Add CSS styles
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
        .zoom-button:active {
            background-color: #e6e6e6 !important;
            transform: scale(0.95);
        }
        .zoom-controls {
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            -khtml-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
        }
    `;
    document.head.appendChild(styleElement);

    return {
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
                colorType: "fixed",
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
                                colorSettings: {
                                    label: "Color Settings",
                                    type: "items",
                                    items: {
                                        colorType: {
                                            ref: "props.colorType",
                                            label: "Point Color Type",
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
                                        pointColor: {
                                            label: "Point Color",
                                            component: "color-picker",
                                            ref: "props.pointColor",
                                            type: "object",
                                            defaultValue: {
                                                index: -1,
                                                color: "#008936"
                                            },
                                            show: function(data) {
                                                return data.props.colorType === "fixed";
                                            }
                                        }
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

                        paint: function($element, layout) {
            try {
                // Get properties from layout
                const props = layout.props;

                // Helper function to get color value from either string or object
                function getColor(colorObj, defaultColor) {
                    if (colorObj && typeof colorObj === 'object' && colorObj.color) {
                        return colorObj.color;
                    } else if (typeof colorObj === 'string') {
                        return colorObj;
                    }
                    return defaultColor;
                }

                const rotationSpeed = props.rotationSpeed / 1000;
                
                const $container = $element.empty().append(`
                    <div class="qv-extension-qlik-globe">
                        <div id="globe-container-${layout.qInfo.qId}"></div>
                    </div>
                `);

                // Ensure data is properly formatted
                const data = layout.qHyperCube.qDataPages[0].qMatrix.map(row => ({
                    latitude: parseFloat(row[0].qNum),
                    longitude: parseFloat(row[1].qNum),
                    name: row[2].qText,
                    sizeValue: row[3] ? row[3].qNum : null,
                    colorValue: row[4] ? row[4].qNum : null
                })).filter(d => !isNaN(d.latitude) && !isNaN(d.longitude));

                const container = document.getElementById(`globe-container-${layout.qInfo.qId}`);
                const width = $container.width();
                const height = $container.height();
                const radius = Math.min(width, height) / 2.5;

                // Define zoom scales
                const minScale = radius * (layout.props.minZoomScale || 0.5);
                const maxScale = radius * (layout.props.maxZoomScale || 2.5);
                const defaultScale = radius * (layout.props.initialZoom || 1.25);

                // Clear any existing SVG
                d3.select(container).selectAll("svg").remove();

                // Create SVG
                const svg = d3.select(container)
                    .append("svg")
                    .attr("width", width)
                    .attr("height", height);

                // Setup projection
                const projection = d3.geoOrthographic()
                    .scale(defaultScale)
                    .translate([width/2, height/2])
                    .center([0, 0])
                    .rotate([0, -25, 0]);

                // Path generator
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
                    .attr("fill", getColor(props.pointColor, "#000075"));

                // Create tooltip styles based on user settings
                const tooltipStyles = {
                    "background-color": getColor(props.tooltipBackgroundColor, "rgba(255, 255, 255, 1)"),
                    "color": getColor(props.tooltipFontColor, "#19426C"),
                    "border": props.tooltipBorderEnabled ? `${props.tooltipBorderWidth || 1}px solid ${getColor(props.tooltipBorderColor, "#FFFFFF")}` : "none",
                    "border-radius": `${props.tooltipBorderRadius !== undefined ? props.tooltipBorderRadius : 4}px`,
                    "padding": `${props.tooltipPadding || 8}px`,
                    "font-size": `${props.tooltipFontSize || 14}px`,
                    "box-shadow": props.tooltipShadowEnabled ? `0 2px ${props.tooltipShadowBlur || 4}px rgba(0,0,0,${props.tooltipShadowOpacity || 0.2})` : "none",
                    "pointer-events": "none",
                    "transition": "opacity 0.2s ease",
                    "z-index": "999",
                    "position": "absolute"
                };
                
                // Add tooltips with customized styles
                // First remove any existing tooltips
                d3.select("#globe-tooltip-" + layout.qInfo.qId).remove();
                
                const tooltip = d3.select("body").append("div")
                    .attr("id", "globe-tooltip-" + layout.qInfo.qId)
                    .attr("class", "globe-tooltip")
                    .style("opacity", 0);
                
                // Apply all custom tooltip styles
                Object.entries(tooltipStyles).forEach(([property, value]) => {
                    tooltip.style(property, value);
                });

                // Helper function to check point visibility
                function isPointVisible(d, projection) {
                    const rotate = projection.rotate();
                    const longitude = d.longitude + rotate[0];
                    const latitude = d.latitude + rotate[1];
                    return Math.cos(latitude * Math.PI / 180) * 
                           Math.cos(longitude * Math.PI / 180) > 0;
                }

                // Update function with point visibility check
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

                

                // Add zoom controls container
                const zoomControls = d3.select(`#globe-container-${layout.qInfo.qId}`)
                    .append("div")
                    .attr("class", "zoom-controls")
                    .style("position", "absolute")
                    .style("bottom", "20px")
                    .style("left", "20px")
                    .style("display", "flex")
                    .style("flex-direction", "column")
                    .style("gap", "5px")
                    .style("touch-action", "none");

                // Add zoom in button
                zoomControls.append("button")
                    .attr("class", "zoom-button")
                    .style("padding", "8px")
                    .style("width", "40px")
                    .style("height", "40px")
                    .style("border", "1px solid #ccc")
                    .style("border-radius", "4px")
                    .style("background", "white")
                    .style("cursor", "pointer")
                    .style("font-size", "20px")
                    .html("&plus;")
                    .on("click", () => {
                        const zoomSpeed = layout.props.zoomSpeed || 1.2;
                        zoomGlobe(zoomSpeed);
                    });

                // Add reset view button
                zoomControls.append("button")
                    .attr("class", "zoom-button")
                    .style("padding", "8px")
                    .style("width", "40px")
                    .style("height", "40px")
                    .style("border", "1px solid #ccc")
                    .style("border-radius", "4px")
                    .style("background", "white")
                    .style("cursor", "pointer")
                    .style("font-size", "18px")
                    .html(`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>`)
                    .on("click", resetView);

                // Add zoom out button
                zoomControls.append("button")
                    .attr("class", "zoom-button")
                    .style("padding", "8px")
                    .style("width", "40px")
                    .style("height", "40px")
                    .style("border", "1px solid #ccc")
                    .style("border-radius", "4px")
                    .style("background", "white")
                    .style("cursor", "pointer")
                    .style("font-size", "20px")
                    .html("&minus;")
                    .on("click", () => {
                        const zoomSpeed = layout.props.zoomSpeed || 1.2;
                        zoomGlobe(1/zoomSpeed);
                    });

                // Add zoom percentage indicator
                const zoomIndicator = zoomControls
                    .append("div")
                    .attr("class", "zoom-indicator")
                    .style("text-align", "center")
                    .style("margin", "5px 0");

                function updateZoomIndicator(scale) {
                    const percentage = Math.round((scale / radius) * 100);
                    zoomIndicator.text(`${percentage}%`);
                }

                const controls = setupInteractions();

                function zoomGlobe(factor) {
                    // Get the current transform from our reference
                    const currentTransform = controls.transformRef.current;
                    
                    // Calculate the new scale based on the zoom factor
                    const newK = currentTransform.k * factor;
                    
                    // Create a new transform with the updated scale, constrained to our limits
                    const newTransform = d3.zoomIdentity.scale(
                        Math.max(
                            layout.props.minZoomScale || 0.5, 
                            Math.min(layout.props.maxZoomScale || 2.5, newK)
                        )
                    );
                    
                    // Apply the new transform with a smooth transition
                    svg.transition()
                        .duration(250)
                        .call(controls.zoom.transform, newTransform);
                }

                function resetView() {
                    const initialRotation = [0, -25, 0];
                    const initialZoomScale = layout.props.initialZoom || 1.25;
                    
                    isAnimating = true;
                    
                    // Reset rotation with a smooth transition
                    d3.transition()
                        .duration(1000)
                        .ease(d3.easeCubicInOut)
                        .tween("reset", () => {
                            const currentRotation = projection.rotate();
                            const rotationInterpolator = d3.interpolate(currentRotation, initialRotation);
                            
                            return t => {
                                projection.rotate(rotationInterpolator(t));
                                countries.attr("d", path);
                                update();
                            };
                        })
                        .on("end", () => {
                            isAnimating = false;
                            
                            // Reset zoom to initial scale with a smooth transition
                            svg.transition()
                                .duration(500)
                                .call(controls.zoom.transform, d3.zoomIdentity.scale(initialZoomScale));
                            
                            // Restart rotation if enabled
                            if (props.rotationSpeed > 0 && !isDragging) {
                                startRotation();
                            }
                        });
                }

                // Setup combined zoom and drag interactions
                function setupInteractions() {
                    let isDragging = false;
                    let isAnimating = false;
                    
                    // Store current transform for reference across function calls
                    const transformRef = { current: d3.zoomIdentity.scale(1) };
                    
                    // Define zoom behavior with proper scale extents
                    const zoom = d3.zoom()
                        .scaleExtent([
                            layout.props.minZoomScale || 0.5, 
                            layout.props.maxZoomScale || 2.5
                        ])
                        .on("zoom", (event) => {
                            if (isAnimating) return;
                            
                            // Update our transform reference
                            transformRef.current = event.transform;
                            
                            // Calculate the absolute scale instead of relative scaling
                            const newScale = defaultScale * event.transform.k;
                            const constrainedScale = Math.max(minScale, Math.min(maxScale, newScale));
                            
                            // Apply the scale to the projection
                            projection.scale(constrainedScale);
                            
                            // Update globe elements with the new scale
                            d3.select("circle.ocean").attr("r", constrainedScale);
                            d3.select("circle.outline").attr("r", constrainedScale);
                            
                            // Update country paths and points
                            update();
                            
                            // Update zoom percentage indicator
                            updateZoomIndicator(constrainedScale);
                        });
                
                    // Define drag behavior (keep your existing code)
                    const drag = d3.drag()
                        .on("start", () => {
                            isDragging = true;
                            if (rotationTimer) rotationTimer.stop();
                        })
                        .on("drag", (event) => {
                            if (isAnimating) return;
                            
                            const rotate = projection.rotate();
                            const k = 75 / projection.scale();
                            
                            projection.rotate([
                                rotate[0] + event.dx * k,
                                Math.max(-90, Math.min(90, rotate[1] - event.dy * k)),
                                rotate[2]
                            ]);
                            
                            countries.attr("d", path);
                            update();
                        })
                        .on("end", () => {
                            isDragging = false;
                            if (props.rotationSpeed > 0) {
                                startRotation();
                            }
                        });
                
                    // Apply the zoom behavior to the SVG
                    svg.call(zoom);
                    
                    // Apply the drag behavior to the SVG
                    svg.call(drag);
                    
                    // Initialize the zoom to the correct scale based on initialZoom property
                    const initialZoomScale = (layout.props.initialZoom || 1.25);
                    svg.call(zoom.transform, d3.zoomIdentity.scale(initialZoomScale));
                    
                    // Return references needed for other functions
                    return { zoom, transformRef };
                }

                // Tooltip events with customized content
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
                    
                    // Add color value if using measure for color
                    if (props.colorType === "measure" && d.colorValue !== null) {
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

                // Auto-rotation
                let rotationTimer;
                
                function startRotation() {
                    if (rotationTimer) rotationTimer.stop();
                    
                    if (props.rotationSpeed > 0) {
                        let lastTime = Date.now();
                        rotationTimer = d3.timer(function() {
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

                // Initialize interactions
                setupInteractions();
                startRotation();

                // Initial update
                update();
                updateZoomIndicator(defaultScale);

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

        resize: function($element, layout) {
            this.paint($element, layout);
        },
        
        support: {
            snapshot: true,
            export: true,
            exportData: true
        }
    };
});