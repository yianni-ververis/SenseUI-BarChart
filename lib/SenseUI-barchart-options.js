// Define properties
var options = {
	initialProperties: {
			version: 1.2,
			qHyperCubeDef: {
				qDimensions: [{
					qOtherMode: {
						OTHER_ABS_LIMITED: 20,
					},
				}],
				qMeasures: [],
				qInitialDataFetch: [{
					qWidth: 6,
					qHeight: 500
				}]
			}
		},
		definition: {
			type: "items",
			component: "accordion",
			items: {
				dimensions: {
					uses: "dimensions",
					min: 1,
					max: 2
				},
				measures: {
					uses: "measures",
					min: 1,
					max: 5
				},
				sorting: {
					uses: "sorting"
				},
				settings : {
					uses : "settings",
					items: {
						general: {
							type: "items",
							label: "General",
							items: {
								Color: {
									type: "string",
									expression: "none",
									label: "Text color",
									defaultValue: "#000000",
									ref: "vars.color"
								},
								FontSize: {
									type: "string",
									expression: "none",
									label: "Font Size",
									defaultValue: "11",
									ref: "vars.fontSize"
								},
								symbolVisible: {
									type: "boolean",
									component: "switch",
									label: "Add symbols the bar text?",
									ref: "vars.symbol.visible",
									options: [{
										value: true,
										label: "Yes"
									}, {
										value: false,
										label: "No"
									}],
									defaultValue: false
								},
								symbolChar: {
									type: "string",
									component: "buttongroup",
									label: "Symbol",
									ref: "vars.symbol.char",
									options: [{
										value: "$",
										label: "$"
									}, {
										value: "€",
										label: "€",
									}],
									defaultValue: "",
									show : function(data) {
										if (data.vars.symbol && data.vars.symbol.visible) {
											return true;
										}
									}
								},
								precision: {
									type: "boolean",
									component: "switch",
									label: "Display decimals?",
									ref: "vars.precision",
									options: [{
										value: true,
										label: "Yes"
									}, {
										value: false,
										label: "No"
									}],
									defaultValue: false
								},
								limit: {
									type: "string",
									expression: "none",
									label: "Limit the number of bars (0 for All)",
									defaultValue: "0",
									ref: "vars.limit"
								},
							},
						},
						bar: {
							type: "items",
							label: "Bar",
							items: {
								barFillColor: {
									type: "string",
									expression: "none",
									label: "Fill color Separated by comma if stacked bar. If Empty, use default Sense palette",
									defaultValue: "#4477AA",
									ref: "vars.bar.fillColor"
								},
								barFillHoverColor: {
									type: "string",
									expression: "none",
									label: "Fill hover color",
									defaultValue: "#77b62a",
									ref: "vars.bar.fillHoverColor"
								},
								barTextColor: {
									type: "string",
									expression: "none",
									label: "Text color",
									defaultValue: "#000000",
									ref: "vars.bar.textColor"
								},
								barTextHoverColor: {
									type: "string",
									expression: "none",
									label: "Text hover color",
									defaultValue: "#000000",
									ref: "vars.bar.textHoverColor"
								},
								barBorderWeight: {
									type: "number",
									expression: "none",
									label: "Border weight",
									component: "slider",
									ref: "vars.bar.borderWeight",
									defaultValue: 0,
									min: 0,
									max: 3
								},
								barBorderColor: {
									type: "string",
									expression: "none",
									label: "Border color",
									defaultValue: "#404040",
									ref: "vars.bar.borderColor"
								},
								barBorderColorHover: {
									type: "string",
									expression: "none",
									label: "Border Hover Color",
									defaultValue: "#77b62a",
									ref: "vars.bar.borderColorHover"
								},
								barSpacing: {
									type: "number",
									expression: "none",
									label: "Spacing",
									component: "slider",
									ref: "vars.bar.spacing",
									defaultValue: 3,
									min: 3,
									max: 10
								},
								barHeight: {
									type: "number",
									expression: "none",
									label: "Bar height",
									defaultValue: 20,
									ref: "vars.bar.height",
								},
								enableSelections: {
									type: "boolean",
									component: "switch",
									label: "Enable Selections",
									ref: "vars.enableSelections",
									options: [{
										value: true,
										label: "On"
									}, {
										value: false,
										label: "Off"
									}],
									defaultValue: true
								},
								lollipop: {
									type: "boolean",
									component: "switch",
									label: "Lollipop View",
									ref: "vars.bar.lollipop",
									options: [{
										value: true,
										label: "On"
									}, {
										value: false,
										label: "Off"
									}],
									defaultValue: false
								},
								grouped: {
									type: "boolean",
									component: "switch",
									label: "Grouped View",
									ref: "vars.bar.grouped",
									options: [{
										value: true,
										label: "On"
									}, {
										value: false,
										label: "Off"
									}],
									defaultValue: false,
									show : function(data) {
										if (data.qHyperCubeDef.qMeasures.length>1) {
											return true;
										}
									}
								}
							},
						},
						tooltip: {
							type: "items",
							label: "Tooltip",
							items: {
								// @TODO add show function on all tolltip elements if visible is false
								toolVisible: {
									type: "boolean",
									component: "switch",
									label: "Show Tooltip?",
									ref: "vars.tooltip.visible",
									options: [{
										value: true,
										label: "On"
									}, {
										value: false,
										label: "Off"
									}],
									defaultValue: true
								},
								dimension: {
									type: "boolean",
									component: "switch",
									label: "Show Dimension?",
									ref: "vars.tooltip.dimension",
									options: [{
										value: true,
										label: "On"
									}, {
										value: false,
										label: "Off"
									}],
									defaultValue: true
								},
								mashup: {
									type: "boolean",
									component: "switch",
									label: "Will this be in a mashup?",
									ref: "vars.tooltip.mashup",
									options: [{
										value: true,
										label: "Yes"
									}, {
										value: false,
										label: "No"
									}],
									defaultValue: false
								},
								mashupDiv: {
									type: "string",
									expression: "none",
									label: "What is the mashup div id to calculate correct positioning",
									defaultValue: "maincontent",
									ref: "vars.tooltip.divid",
									show : function(data) {
										if (data.vars.tooltip && data.vars.tooltip.mashup) {
											return true;
										}
									}
								},
							},
						},
						xaxis: {
							type: "items",
							label: "X axis",
							items: {
								xaxisVisible: {
									type: "boolean",
									component: "switch",
									label: "Show X Axis?",
									ref: "vars.xaxis.visible",
									options: [{
										value: true,
										label: "On"
									}, {
										value: false,
										label: "Off"
									}],
									defaultValue: false
								},
								legendVisible: {
									type: "boolean",
									component: "switch",
									label: "Show Legend?",
									ref: "vars.legend.visible",
									options: [{
										value: true,
										label: "On"
									}, {
										value: false,
										label: "Off"
									}],
									defaultValue: true
								}
							},
						},
						yaxis: {
							type: "items",
							label: "Y axis",
							items: {
								yaxisVisible: {
									type: "boolean",
									component: "switch",
									label: "Show Y Axis?",
									ref: "vars.yaxis.visible",
									options: [{
										value: true,
										label: "On"
									}, {
										value: false,
										label: "Off"
									}],
									defaultValue: true
								},
								yaxisWidth: {
									type: "number",
									expression: "none",
									label: "Label width",
									defaultValue: 150,
									ref: "vars.yaxis.width",
								},
								yaxisCharacters: {
									type: "number",
									expression: "none",
									label: "Number of visible characters",
									defaultValue: 50,
									ref: "vars.yaxis.characters",
								},
								yaxisRightPadding: {
									type: "number",
									expression: "none",
									label: "Right Padding",
									defaultValue: 50,
									ref: "vars.yaxis.rightPadding",
								},
							},
						},
					}
				}
			}
		}
	};

define(options);