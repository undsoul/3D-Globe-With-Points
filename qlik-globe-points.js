define(['qlik', 'jquery', 'text!./globeCoordinates.json'], function(qlik, $, worldJson) {
    'use strict';

    const worldData = JSON.parse(worldJson); 

    return {
        initialProperties: {
            qHyperCubeDef: {
                qDimensions: [],
                qMeasures: [],
                qInitialDataFetch: [{
                    qWidth: 5, // Increased for additional measures
                    qHeight: 1000
                }]
            },
            props: {
                rotationSpeed: 20,
                countryColor: "#d4dadc",
                oceanColor: "#e6f3ff",
                pointColor: "#000075",
                pointSize: 3,
                colorType: "fixed",
                sizeType: "fixed",
                selectionMode: "click"
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
                                rotationSpeed: {
                                    ref: "props.rotationSpeed",
                                    label: "Rotation Speed",
                                    type: "number",
                                    component: "slider",
                                    min: 0,
                                    max: 100,
                                    step: 1,
                                    defaultValue: 20
                                },
                                countryColor: {
                                    ref: "props.countryColor",
                                    label: "Country Color",
                                    type: "string",
                                    component: "color-picker",
                                    defaultValue: "#d4dadc"
                                },
                                pointSettings: {
                                    label: "Point Settings",
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
                                            ref: "props.pointColor",
                                            label: "Point Color",
                                            type: "string",
                                            component: "color-picker",
                                            defaultValue: "#000075",
                                            show: function(data) {
                                                return data.props.colorType === "fixed";
                                            }
                                        },
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
                                        selectionMode: {
                                            ref: "props.selectionMode",
                                            label: "Selection Mode",
                                            type: "string",
                                            component: "buttongroup",
                                            options: [{
                                                value: "none",
                                                label: "None"
                                            }, {
                                                value: "click",
                                                label: "Click"
                                            }, {
                                                value: "lasso",
                                                label: "Lasso"
                                            }],
                                            defaultValue: "click"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        paint: function($element, layout) {
            require(['https://d3js.org/d3.v7.min.js'], function(d3) {
                try {
                    // Get properties from layout
                    const props = layout.props;
                    const rotationSpeed = props.rotationSpeed / 1000; // Convert to appropriate speed
                    
                    const $container = $element.empty().append(`
                        <div class="qv-extension-qlik-globe">
                            <div id="globe-container-${layout.qInfo.qId}"></div>
                        </div>
                    `);

                    const data = layout.qHyperCube.qDataPages[0].qMatrix.map(row => ({
                        latitude: row[0].qNum,
                        longitude: row[1].qNum,
                        name: row[2].qText
                    }));

                    const container = document.getElementById(`globe-container-${layout.qInfo.qId}`);
                    const width = $container.width();
                    const height = $container.height();
                    const radius = Math.min(width, height) / 2.5;

                    // Create SVG
                    const svg = d3.select(container)
                        .append("svg")
                        .attr("width", width)
                        .attr("height", height);

                    // Setup projection
                    const projection = d3.geoOrthographic()
                        .scale(radius)
                        .center([0, 0])
                        .rotate([0, -25])
                        .translate([width/2, height/2]);

                    // Path generator
                    const path = d3.geoPath()
                        .projection(projection);

                    // Add base circle for ocean
                    svg.append("circle")
                        .attr("cx", width/2)
                        .attr("cy", height/2)
                        .attr("r", radius)
                        .attr("class", "ocean")
                        .attr("fill", props.oceanColor);

                    // Draw world map
                    const countries = svg.append("g")
                        .attr("class", "countries")
                        .selectAll("path")
                        .data(worldData.features)
                        .enter()
                        .append("path")
                        .attr("class", "country")
                        .attr("fill", props.countryColor)
                        .attr("stroke", "#999")
                        .attr("stroke-width", 0.5);

                    // Add globe outline
                    svg.append("circle")
                        .attr("cx", width/2)
                        .attr("cy", height/2)
                        .attr("r", radius)
                        .attr("fill", "none")
                        .attr("stroke", "#000")
                        .attr("stroke-width", 0.25);

                    // Add location points
                    const dots = svg.selectAll("circle.location")
                        .data(data)
                        .enter()
                        .append("circle")
                        .attr("class", "location")
                        .attr("r", props.pointSize)
                        .attr("fill", props.pointColor);

                    // Add tooltips
                    const tooltip = d3.select("body").append("div")
                        .attr("class", "globe-tooltip")
                        .style("opacity", 0);

                    // Update function
                    function update() {
                        countries.attr("d", path);
                        
                        dots.attr("transform", d => {
                            const pos = projection([d.longitude, d.latitude]);
                            return pos ? `translate(${pos[0]},${pos[1]})` : null;
                        })
                        .attr("visibility", d => {
                            const pos = projection([d.longitude, d.latitude]);
                            if (!pos) return "hidden";
                            const rotate = projection.rotate();
                            const longitude = d.longitude + rotate[0];
                            const latitude = d.latitude + rotate[1];
                            return Math.cos(latitude * Math.PI / 180) * 
                                   Math.cos(longitude * Math.PI / 180) > 0 
                                   ? "visible" : "hidden";
                        });
                    }

                    // Add drag behavior
                    const sensitivity = 75;

                    const drag = d3.drag()
                        .on("start", () => {
                            if (rotationTimer) rotationTimer.stop();
                        })
                        .on("drag", (event) => {
                            const rotate = projection.rotate();
                            const k = sensitivity / projection.scale();
                            
                            projection.rotate([
                                rotate[0] + event.dx * k,
                                rotate[1] - event.dy * k,
                                rotate[2]
                            ]);
                            
                            update();
                        })
                        .on("end", () => {
                            if (props.rotationSpeed > 0) {
                                startRotation();
                            }
                        });

                    svg.call(drag);

                    // Tooltip events
                    dots.on("mouseover", function(event, d) {
                        d3.select(this).transition()
                            .duration(200)
                            .attr("r", props.pointHoverSize);
                            
                        tooltip.transition()
                            .duration(200)
                            .style("opacity", 0.9);
                        tooltip.html(d.name)
                            .style("left", (event.pageX + 10) + "px")
                            .style("top", (event.pageY - 10) + "px");
                    })
                    .on("mouseout", function() {
                        d3.select(this).transition()
                            .duration(200)
                            .attr("r", props.pointSize);
                            
                        tooltip.transition()
                            .duration(500)
                            .style("opacity", 0);
                    });

                    // Initial update
                    update();

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
                                    rotation[1]
                                ]);
                                
                                update();
                            });
                        }
                    }

                    startRotation();

                } catch (err) {
                    console.error('Error in globe visualization:', err);
                }
            });

            return qlik.Promise.resolve();
        }
    };
});
