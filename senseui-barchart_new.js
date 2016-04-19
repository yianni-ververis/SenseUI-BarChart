define([
	"qlik",
	"jquery",
	"qvangular",
	'underscore',
	"core.utils/theme",
	"css!./senseui-barchart.css",
	// "text!./template.html",
	// "./d3.min",
	'./d3-tip'
], function(qlik, $, qvangular, _, Theme) {
'use strict';

	// Define properties
	var me = {
		initialProperties: {
			version: 1.0,
			qHyperCubeDef: {
				qDimensions: [],
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
					max: 1
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
								}
							},
						},
						xaxis: {
							type: "items",
							label: "X axis",
							items: {
								xaxisVisible: {
									type: "boolean",
									component: "switch",
									label: "On / Off",
									ref: "vars.xaxis.visible",
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
									label: "On / Off",
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
							},
						},
					}
				}
			}
		}
	};
	
	// Get Engine API app for Selections
	me.app = qlik.currApp(this);
	
	me.snapshot = {
		canTakeSnapshot : true
	};

	me.paint = function($element,layout) {
// console.log(layout);
// console.log(this);
// console.log(Theme);
		var vars = {
			id: layout.qInfo.qId,
			data: layout.qHyperCube.qDataPages[0].qMatrix,
			data2: layout.qHyperCube.qDataPages[0].qMatrix,
			height: $element.height(),
			width: $element.width(),
			stacked: (layout.qHyperCube.qSize.qcx > 2) ? true : false,	
			color: (layout.vars.color)?layout.vars.color:'#000000',
			fontSize: (layout.vars.fontSize)?layout.vars.fontSize + 'px':'11px',
			bar: {
				height: (layout.vars.bar.height)?layout.vars.bar.height:20,
				padding: (layout.vars.bar.spacing)?layout.vars.bar.spacing:3,
				border: layout.vars.bar.borderWeight,
				color: (layout.vars.bar.fillColor)?layout.vars.bar.fillColor:'#4477AA',
				colorHover: (layout.vars.bar.fillHoverColor)?layout.vars.bar.fillHoverColor:'#77b62a',
				textColor: (layout.vars.bar.textColor)?layout.vars.bar.textColor.split(','):['#000000'],
				textHoverColor: (layout.vars.bar.textHoverColor)?layout.vars.bar.textHoverColor:'#000000',
				borderColor: (layout.vars.bar.borderColor)?layout.vars.bar.borderColor:'#404040'
			},
			label: {
				visible: layout.vars.yaxis.visible,
				width: (layout.vars.yaxis.width) ? layout.vars.yaxis.width:150,
				characters: (layout.vars.yaxis.characters) ? layout.vars.yaxis.characters:50,
				padding: 15
			},
			footer: {
				visible: layout.vars.xaxis.visible,
				height: 20
			},
			canvasHeight: null,
			template: '',
			dimensionTitle: layout.qHyperCube.qDimensionInfo, //[0].qFallbackTitle
			measureTitle: layout.qHyperCube.qMeasureInfo, //[0].qFallbackTitle
			verticalGridSpace: 60,
			verticalGridLines: null,
			enableSelections: (layout.vars.enableSelections)? true : false,
			palette: (layout.vars.bar.fillColor)? layout.vars.bar.fillColor.split(',') : ['#332288','#88CCEE','#117733','#DDCC77','#CC6677','#3399CC','#CC6666','#99CC66','#275378','#B35A01','#B974FD','#993300','#99CCCC','#669933','#898989','#EDA1A1','#C6E2A9','#D4B881','#137D77','#D7C2EC','#FF5500','#15DFDF','#93A77E','#CB5090','#BFBFBF'],
			this: this
		};

		vars.verticalGridLines = Math.round((vars.width-vars.label.width)/vars.verticalGridSpace);
		vars.template = '\
			<div qv-extension class="ng-scope senseui-barchart" id="' + vars.id + '">\
				<div class="content"></div>\
		';
		if (vars.footer.visible) {
			vars.template += '<div class="footer"></div>';
		};
		vars.template += '</div>';

		// Adjust label width based on the parent window
		// if (vars.width <= 200 && vars.label.visible) {
		// 	vars.label.width = 50;
		// } else if (vars.width <= 300 && vars.label.visible) {
		// 	vars.label.width = 80;
		// }	

		vars.data = vars.data.map(function(d) {
			return {
				"dimension":d[0].qText,
				"measure":d[1].qText,
				"measureNum":d[1].qNum,
				"qElemNumber":d[0].qElemNumber,
			}
		});
		
		// CSS
		$( '#' + vars.id ).css( "color", vars.color );

		if (document.getElementById(vars.id)) {
			// $("#" + vars.id).empty();
			$element.empty();
		}

		// Check the height of the combines rects
		var calculatedHeight = vars.data2.length * (vars.bar.height + vars.bar.padding);
		// vars.bar.height = (vars.height > calculatedHeight) ? vars.height/vars.data.length : vars.bar.height;

		// $element.append($('<div />;').attr("id", vars.id).width(vars.width).height(vars.height).addClass('outer'));
		$element.append($(vars.template).width(vars.width).height(vars.height));
		if (vars.footer.visible) {
			$('#' + vars.id + ' .content').height(vars.height-vars.footer.height);
			$('#' + vars.id + ' .footer').height(vars.footer.height);
		} else {
			$('#' + vars.id + ' .content').height(vars.height);
		}

		var dMax = d3.max(vars.data, function(d) { return d.measureNum; });
		// Get the first measure for max for now

		// Loop through results
		for (var i = 0; i < vars.data2.length; i++) {
			vars.data2[i].total = 0;
			// Loop through the Measures in the results. 0 is assumed to be the Dimension
			for (var j = 1; j < vars.data2[i].length; j++) {
				vars.data2[i].total += vars.data2[i][j].qNum;
				// Assign the qElemNumber on every measure so we can access it from d3 on each element and enable selections
				vars.data2[i][j].qElemNumber = vars.data2[i][0].qElemNumber;
				vars.data2[i][j].ypos = i; // The parent array index
				vars.data2[i][j].xpos = 0; // The x position for the stacked bar
				vars.data2[i][j].dist = 0;
			}
// console.log(vars.data2[i][0].qText)
		}
		var dMax2 = d3.max(vars.data2, function(d) { return d.total; });

		vars.canvasHeight = (vars.data.length * (vars.bar.height+(vars.bar.padding*2)+3));
// console.log(verticalGridLines);
		// var grid = d3.range(vars.verticalGridLines).map(function(i){
		// 	console.log(i);
		// 	return {'x1':0,'y1':0,'x2':0,'y2':vars.canvasHeight};
		// });
// console.log(dMax); //tickvalues = dmax / number of vertical grid lines

		// var tickVals = grid.map(function(d,i){
		// 	if(i>0){ return i*10; }
		// 	else if(i===0){ return "100";}
		// });

// console.log(grid);
// console.log(tickVals);

		var x = d3.scale.linear()
			.domain([0,dMax2])
			.range([0, (vars.label.visible)?vars.width-vars.label.width-(vars.label.padding*2):vars.width]);

		var y = d3.scale.linear()
			.domain([0,vars.data2.length])
			.range([10,vars.canvasHeight]);

		// var colorScale = d3.scale.quantize()
		// 	.domain([0,data.length])
		// 	.range(colors);

		// var svgLabel = d3.select('#' + vars.id + ' .content')
		// 	.append('svg')
		// 	.attr('id','svgLabel')
		// 	.attr({'width':vars.label.width,'height':vars.canvasHeight});

		var svg = d3.select('#' + vars.id + ' .content')
			.append('svg')
			.attr({'width':vars.width,'height':vars.canvasHeight});

		// if (vars.label.visible) {
		// }

		if (vars.footer.visible) {
			var svgFooter = d3.select('#' + vars.id + ' .footer')
				.append('svg')
				.attr({'width':vars.width,'height':vars.footer.height});
		}

		// Create Parent Group layering
		// svg.append("g").attr("id", "grid");

		// Draw the tooltip
		// Offset that works
		// $('#yKJHxQY').offset().top
		if ($('.' + vars.id + ' .d3-tip').length > 0) {
			$('.' + vars.id + ' .d3-tip ').remove();
		}
		var tip = d3.tip()
			.attr('class', vars.id + ' d3-tip')
			.offset([-10, 0]) 
			.offsetTop($('#' + vars.id).offset().top) 
			.html(function(d,i) {
				var html = '\
					<div class="dimension">' + vars.data2[d.position][0].qText + '</div>\
					<div class="measure">' + vars.measureTitle[i-1].qFallbackTitle + ' :' + vars.data2[d.position][i].qText + '</div>\
				';

				return html;
			})

		svg.call(tip);

		// Vertical Gray Grid Lines
		// var grids = svg.append('g')
		// 	.attr('id','grid')
		// 	.attr('transform','translate(' + vars.label.width + ',10)')
		// 	.selectAll('line')
		// 	.data(grid)
		// 	.enter()
		// 	.append('line')
		// 	.attr({'x1':function(d,i){ return i*30; },
		// 		 'y1':function(d){ return d.y1; },
		// 		 'x2':function(d,i){ return i*30; },
		// 		 'y2':function(d){ return d.y2; },
		// 	})
		// 	.style({'stroke':'#adadad','stroke-width':'1px'});

		var	xAxis = d3.svg.axis()
			.scale(x)
			.orient('bottom');
			// .tickSize(1)
		 //    .ticks(vars.verticalGridLines);

		// var xAxisGrid = d3.svg.axis()
		//     .scale(x)
		//     .orient("bottom")
		//     .ticks(vars.verticalGridLines);

		var	yAxis = d3.svg.axis()
			.scale(y)
			.orient('left')
			.tickSize(1)
			.tickFormat(function(d,i){
				return vars.data2[i][0].qText; 
				// return vars.data2[i][0].qText.substring(0,vars.label.characters); 
			})
			.tickValues(d3.range(vars.data.length)); //1167

		// Vertical Gray Grid Lines
		// svg.select("#grid")
			// .append("g")
	        // .attr("class", "grid")
		// svg.append('g')
	 //        .attr("transform", "translate(0," + vars.height + ")")
		// 	.attr('id','svggrid')
	 //        // .call(xAxis);
	 //        .call(xAxisGrid
	 //            .tickSize(vars.height)
	 //            .tickFormat("")
	 //        );

		// Y Axis labels
	 	if (vars.label.visible){
			var y_xis = svg.append('g')
				.attr("transform", "translate("+vars.label.width+", -10)")
				.attr('id','yaxis')
				.attr('width', vars.label.width-10)

				// .append('rect')
				// .attr('width', '100')
				// .attr('height', '100') 
				// .attr("transform", "translate(-"+vars.label.width+",0)")
				// .attr("clip-path", "url(#yaxis)")

			// 
			// y_xis.append("foreignObject")
			// 		.attr("transform", "translate(-"+vars.label.width+",0)")
			// 		.attr('id','clippath')
			// 		.attr("width", vars.label.width)
			// 		.attr('height', vars.bar.height) 
			// 		.attr("class", "myCSS")
			// 		.append("xhtml:div")
				// 	.attr('style', function(d,i) {
				// 		var style = 'font-size:' + vars.fontSize + '; fill: ' +  vars.color + ';';
				// 		return style;
				// 	})
				// 	.attr('x', 0)
				// 	.attr('y', function(d, i) {
				// 		console.log(i)
				// 	})
					// .html("this is a very long text")
				// .call(yAxis)

					// .call(wrap);

			y_xis.call(yAxis)
				.selectAll("text")  
					.style("text-anchor", "start")
					.attr("x", "-"+vars.label.width)
					.attr("y", 15)
					.attr('style', 'fill:' + vars.color + '; font-size:' + vars.fontSize + ';')
					.call(wrap, vars.label.width);

			// y_xis.call(yAxis)
				// .append("rect") 
				// 	.attr('style', 'fill:#dddddd')
				// 	.attr('width', vars.label.width-5)
				// 	.attr('height', vars.bar.height) 
				// 	.attr('x', -vars.label.width)
				// 	.attr('y', function(d,i){
				// 		return y(j)+19;
				// 	}) 

			// for (var j=0; j<vars.data2.length; j++) {
			// 	y_xis.data(vars.data2[j])
			// 		.enter()
			// 		.append('text')
			// 		.attr("transform", "translate(-"+vars.label.width+",0)")
			// 		.attr('style', function(d,i) {
			// 			var style = 'font-size:' + vars.fontSize + '; fill: ' +  vars.color + ';';
			// 			return style;
			// 		})
			// 		.attr("clip-path", "url(#clippath)")
			// 		.attr('x', 0)
			// 		.attr('y', y(j)+22+(vars.bar.height/2))
			// 		.text(vars.data2[j][0].qText)
			// }
			// for (var j=0; j<vars.data2.length; j++) {
			// 	y_xis.data(vars.data2[j])
			// 	 	.enter()
			// 		.append('rect')
			// 		.attr('style', 'fill:#dddddd')
			// 		.attr('width', vars.label.width-5)
			// 		.attr('height', vars.bar.height) 
			// 		.attr('x', -vars.label.width)
			// 		.attr('y', function(d,i){
			// 			return y(j)+19;
			// 		})
			// }
		}

		// X Axis labels
		if (vars.footer.visible) {
			svgFooter.append('g')
				.attr("transform", "translate("+((vars.label.visible)?vars.label.width:0)+",0)")
				.attr('id','xaxis')
				.attr('style', 'fill:' + vars.color)
				.call(xAxis
					.tickSize(1)
			    	.ticks(vars.verticalGridLines)
			    );
		}
		
		// function wrap(text) {
		// 	console.log(text[0]);
		// 	// console.log(text.clientWidth);
		// 	for (var i=0; i<text[0].length; i++) {
		// 		if (text[0][i].clientWidth > vars.label.width) {
		// 			text[0][i].clientWidth = vars.label.width;
		// 		}
		// 		console.log(text[0][i].clientWidth);
		// 	}
		// }
		function wrap(text, width) {
			text.each(function() {
				var text = d3.select(this),
				words = text.text().split(/\s+/).reverse(),
				word,
				line = [],
				lineNumber = 0,
				lineHeight = 1, // ems
				y = text.attr("y"),
				dy = parseFloat(text.attr("dy")),
				tspan = text.text(null).append("tspan").attr("x", -vars.label.width).attr("y", y).attr("dy", dy + "em");
				while (word = words.pop()) {
					line.push(word);
					tspan.text(line.join(" "));
					if (tspan.node().getComputedTextLength() > width - 20) {
						line.pop();
						tspan.text(line.join(" "));
						line = [word];
						tspan = text.append("tspan").attr("x", -vars.label.width).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
					}
				}
			});
		}

		var bars = svg.append('g')
			.attr("transform", "translate("+((vars.label.visible)?vars.label.width:0)+",-20)") //-20
			.attr('id','bars')
			.selectAll('#' + vars.id + ' rect');


		for (var j=0; j<vars.data2.length; j++) {
			var xposBar = 0;
			var xposText = 0;
			// bars.data(vars.data2[j])
			// 	.enter()
			// 	.append('rect')
			// 		.attr('style', function(d,i){
			// 			return '\
			// 				fill: ' + vars.palette[i-1] + '; \
			// 				stroke-width:' + vars.bar.border + '; \
			// 				stroke: ' + vars.bar.borderColor + ';\
			// 				cursor: pointer;\
			// 			';
			// 		})
			// 		.attr('width', function(d,i){
			// 			if(i>0) {
			// 				return x(d.qNum);
			// 			}
			// 		})
			// 		.attr('height', vars.bar.height) 
			// 		.attr('x',function(d,i){
			// 			if(i>0) {
			// 				xposBar += x(d.qNum); 
			// 				return xposBar - x(d.qNum);
			// 			}
			// 		})
			// 		.attr('y', function(d,i){
			// 			if(i>0) {
			// 				return y(j)+19;
			// 			}
			// 		})
			// 		.on('mouseover', function(d,i){
			// 			d3.select(this).style("fill", vars.bar.colorHover);
			// 			tip.show(j, i); 
			// 		})
			// 		.on('mouseout', function(d,i){
			// 			tip.hide(); 
			// 			d3.select(this).style("fill", vars.palette[i-1]);
			// 		})
			// 		.on('click', function(d,i) {
			// 			tip.hide();
			// 			if (vars.enableSelections) {
			// 				vars.this.backendApi.selectValues(0, [d.qElemNumber], false);
			// 			}
			// 		});
			// bars.data(vars.data2[j])
			// 	.enter()
			// 	.append('text')
			// 	.attr('style', function(d,i) {
			// 		var style = 'font-size:' + vars.fontSize + ';';
			// 		if (vars.stacked) {
			// 			var textColor = (vars.bar.textColor.length>1)?vars.bar.textColor[i-1]:vars.bar.textColor[0];
			// 			style += 'fill: ' + textColor  + ';';
			// 		} else {
			// 			style += (x(d.measureNum)>(x(d.qNum)+10)) ? 'fill: ' + textHoverColor  + ';': 'fill: ' +  vars.color + ';';
			// 		}
			// 		return style;
			// 	})
			// 	.text( function(d,i) {
			// 		if(i>0 && x(d.qNum)>10 && vars.stacked) {
			// 			return d.qText;
			// 		} else if (i>0 && !vars.stacked) {
			// 			return d.qText;
			// 		}
			// 	})
			// 	.attr('x', function(d,i){
			// 		var xwidth = x(d.qNum);
			// 		var textWidth = this.getBBox().width+10;
			// 		if(i>0 && x(d.qNum)>textWidth && vars.stacked) {
			// 			xposText += xwidth; 
			// 			return xposText - xwidth + (xwidth/2) - 10;
			// 		} else if(i>0 && !vars.stacked) {
			// 			return (xwidth>textWidth)?xwidth/2 - (textWidth/2) :xwidth + 5;
			// 		}
			// 	})
			// 	.attr('y', y(j)+22+(vars.bar.height/2));
			
			// bars.data(vars.data2[j])
			// 	.enter()
			// 	.append('text')
			// 	.attr("transform", "translate(-"+vars.label.width+",0)")
			// 	.attr('style', function(d,i) {
			// 		var style = 'font-size:' + vars.fontSize + '; fill: ' +  vars.color + ';';
			// 		return style;
			// 	})
			// 	.attr("clip-path", "url(#clippath)")
			// 	.attr('x', 0)
			// 	.attr('y', y(j)+22+(vars.bar.height/2))
			// 	.text(vars.data2[j][0].qText)

			// bars.data(vars.data2[j])
			//  	.enter()
			// 	.append('rect')
			// 	.attr('style', 'fill:#dddddd')
			// 	.attr('width', vars.label.width-5)
			// 	.attr('height', vars.bar.height) 
			// 	.attr('x', -vars.label.width)
			// 	.attr('y', function(d,i){
			// 		return y(j)+19;
			// 	})
				// .append("foreignObject")
				// 	.attr("transform", "translate(-"+vars.label.width+",0)")
				// 	.attr('id','clippath')
				// 	.attr("width", vars.label.width)
				// 	.attr('height', vars.bar.height) 
				// 	.attr("class", "myCSS")
				// 	.append("xhtml:div")
				// 	.html(function(d,i){
				// 		console.log(d);
				// 		return d.qText
				// 	})

		}
		
		var xpos = 0;

		var bars2 = svg.selectAll(".content")
			.data(vars.data2)
			.enter().append("g")
			.attr("transform", "translate("+((vars.label.visible)?vars.label.width:0)+",-20)") //-20
			.attr('class','bars');

		bars2.selectAll('#' + vars.id + ' bars') //
			.append("rect")
			.data(function(e,j) { 
				return e; 
			})
			.enter().append("rect")
			.attr('style', function(d,i){ //vars.palette[i-1]
				return '\
					fill: ' + vars.palette[i-1] + '; \
					stroke-width:' + vars.bar.border + '; \
					stroke: ' + vars.bar.borderColor + ';\
					cursor: pointer;\
				';
			})
			.attr("x", function(d,i) {
				if (i==0){
console.log(d);
console.log(vars.data2);
console.log(vars.data2[d.ypos]);
					vars.data2[d.ypos][0].dist = 0;
				}
				if (i>0) {
console.log(i);
console.log(vars.data2[d.ypos][i-1].dist);
					d.dest = vars.data2[d.ypos][i-1].dist + x(d.qNum);
					vars.data2[d.ypos][i].dist = d.dest;
console.log(d.dest);
					return d.dest;
				}
// vars.data2[d.ypos][i].xpos2 = i;
				// if (i==0) {
				// 	xpos = 0;
				// } else if (i==1) {
				// 	xpos = x(d.qNum);
				// 	return 0;
				// } else if (i>1) {
				// 	xpos += x(d.qNum);
				// } 
// 				if(i>0) {
// 					xpos = 0;
// 					if(i>1) {
// // console.log(vars.data2[d.ypos][i-1].xpos);
// 						// vars.data2[d.ypos][i-1].xpos = x(d.qNum);
// 						xpos = x(d.qNum);
// 						// xpos = d.xpos;
// 					}
					// d.xpos += (i==1) ? 0 : vars.data2[d.ypos][i-1].xpos + x(d.qNum); 
					// return vars.data2[d.ypos][i-1].xpos;
				// } 
			})
			.attr('width', function(d,i){
				if(d.qNum!=='NaN') {
					return x(d.qNum);
				}
			})
			.attr('y', function(d,i){
				if(d.qNum!=='NaN') {
					return y(d.ypos)+19;
				}
			})
			.attr("height", vars.bar.height)
			.on('mouseover', function(d,i){
				d3.select(this).style("fill", vars.bar.colorHover);
				tip.show(d, i); 
			})
			.on('mouseout', function(d,i){
				tip.hide(); 
				d3.select(this).style("fill", vars.palette[i-1]);
			})
			.on('click', function(d,i) {
				tip.hide();
				if (vars.enableSelections) {
					vars.this.backendApi.selectValues(0, [d.qElemNumber], false);
				}
			});

		bars2.selectAll('#' + vars.id + ' bars') 
			.append('text')
			.data(function(d,j) { 
				return d; 
			})
			.enter().append("text")
			.attr('style', function(d,i) {
				var style = 'font-size:' + vars.fontSize + ';';
				if (vars.stacked) {
					var textColor = (vars.bar.textColor.length>1)?vars.bar.textColor[i-1]:vars.bar.textColor[0];
					style += 'fill: ' + textColor  + ';';
				} else {
					style += (x(d.qNum)>10) ? 'fill: ' + vars.bar.textHoverColor[0]  + ';': 'fill: ' +  vars.color + ';';
				}
				return style;
			})
			.text( function(d,i) {
				if(d.qNum!=='NaN') {
					if(i>0 && x(d.qNum)>10 && vars.stacked) {
						return d.qText;
					} else if (i>0 && !vars.stacked) {
						return d.qText;
					}
				}
			})
			.attr('x', function(d,i){
				if(d.qNum!=='NaN') {
					var xwidth = x(d.qNum);
					var textWidth = this.getBBox().width+10;
					if(i>0 && x(d.qNum)>textWidth && vars.stacked) {
						xposText += xwidth; 
						return xposText - xwidth + (xwidth/2) - 10;
					} else if(i>0 && !vars.stacked) {
						return (xwidth>textWidth)?xwidth/2 - (textWidth/2) :xwidth + 5;
					}
				}
			})
			.attr('y', function(d,i){
				if(d.qNum!=='NaN') {
					return y(d.ypos)+22+(vars.bar.height/2);
				}
			});
console.log(vars.data2);

// 		vars.data2.forEach(function (d, i) {
// 			var xpos = 0;
// 			d.forEach(function (d2, i2) {
// 				if (i2 > 0) {
// 					var xwidth = x(d2.qNum);
// 					bars.append('rect')
// 						// .attr('fill', vars.palette[i2])	
// 						.attr('style', '\
// 							fill: ' + vars.palette[i2-1] + '; \
// 							stroke-width:' + vars.bar.border + '; \
// 							stroke: ' + vars.bar.borderColor + ';\
// 							cursor: pointer;\
// 						')
// 						.attr('width', xwidth)
// 						.attr('height', vars.bar.height) 
// 						.attr('x',xpos)
// 						.attr('y', y(i)+19)
// 						.on('mouseover', function(){
// 							d3.select(this).style("fill", vars.bar.colorHover);
// 							tip.show(d, i2); 
// 						})
// 						.on('mouseout', function(){
// 							tip.hide(); 
// 							d3.select(this).style("fill", vars.palette[i2-1]);
// 						})
// 						.on('click', function() {
// 							tip.hide();
// 							if (vars.enableSelections) {
// 								vars.this.backendApi.selectValues(0, [d2.qElemNumber], false);
// 							}
// 						});
// 					bars.append('text')
// 						.attr('style', function() {
// 							var style = 'font-size:' + vars.fontSize + ';';
// 							if (vars.stacked) {
// 								var textColor = (vars.bar.textColor.length>1)?vars.bar.textColor[i2-1]:vars.bar.textColor[0];
// 								style += 'fill: ' + textColor  + ';';
// 							} else {
// 								style += (x(d2.measureNum)>(xwidth+10)) ? 'fill: ' + textHoverColor  + ';': 'fill: ' +  vars.color + ';';
// 							}
// 							return style;
// 						})
// 						.attr('x', (xwidth/2) + xpos -10)
// 						.attr('y', y(i)+22+(vars.bar.height/2))
// 						.text( function() {
// 							if (xwidth>10) {
// console.log(d2.qText);
// 								return d2.qText;
// 							}
// 						});
// 					xpos += xwidth;
// 				}
// 			})
// 		});
		
		// Bars
		// var chart = svg.append('g')
		// 	.attr("transform", "translate("+((vars.label.visible)?vars.label.width:0)+",-20)") //-20
		// 	.attr('id','bars')
		// 	.selectAll('#' + vars.id + ' rect')
		// 	.data(vars.data)
		// 	.enter()
		// 	.append('rect')
		// 	.attr('height', vars.bar.height)
		// 	.attr({'x':0,'y':function(d,i){ return y(i)+19; }})
		// 	.attr('style', '\
		// 		fill: ' + vars.bar.color + '; \
		// 		stroke-width:' + vars.bar.border + '; \
		// 		stroke: ' + vars.bar.borderColor + ';\
		// 		cursor: pointer;\
		// 	')
		// 	.attr('width',function(d){ 
		// 		return x(d.measureNum);
		// 	})
		// 	.on('mouseover', function(d, i){
		// 		d3.select(this).style("fill", vars.bar.colorHover);
		// 		tip.show(d); 
		// 	})
		// 	.on('mouseout', function(d, i){
		// 		tip.hide(); 
		// 		d3.select(this).style("fill", vars.bar.color);
		// 	})
		// 	.on('click', function(d, i) {
		// 		tip.hide();
		// 		if (vars.enableSelections) {
		// 			vars.this.backendApi.selectValues(0, [d.qElemNumber], false);
		// 		}
		// 	});

		// var transit = d3.select("svg").selectAll('#' + vars.id + " rect")
		//     .data(vars.data)
		//     .transition()
		//     .duration(1000) 
		//     .attr("width", function(d) { return x(d.measureNum); });

		// // Bar Text
		// var transitext = d3.select('#' + vars.id + ' #bars')
		// 	.selectAll('text')
		// 	.data(vars.data)
		// 	.enter()
		// 	.append('text')
		// 	.text(function(d){ return d.measure; })
		// 	.attr({'x':function(d) {
		// 		var textWidth = this.getBBox().width;
		// 		return (x(d.measureNum)>(textWidth+10)) ? (x(d.measureNum)/2 - (textWidth/2)) : x(d.measureNum)+5; 
		// 	},'y':function(d,i){ 
		// 		return y(i)+22+(vars.bar.height/2); 
		// 	}})
		// 	.attr('style', function(d,i) {
		// 		var textWidth = this.getBBox().width;
		// 		var style = 'font-size:' + vars.fontSize + ';';
		// 		style += (x(d.measureNum)>(textWidth+10)) ? 'fill: ' +  vars.bar.textHoverColor + ';': 'fill: ' +  vars.color + ';'					// .attr('style', 'fill:' + vars.color + '; font-size:' + vars.fontSize + ';');
		// 		return style;
		// 	})
		// 	.on('click', function(d, i) {
		// 		if (vars.enableSelections) {
		// 			vars.this.selectValues(0, [d.qElemNumber], false);
		// 		}
		// 	});

		me.log('info', 'SenseUI-BarChart:', 'Loaded!');
	};

	// Controller for binding
	me.controller =['$scope', '$rootScope', function($scope, $rootScope){
		// console.log($scope.$parent.layout.qHyperCube.qDimensionInfo[0].qFallbackTitle);
		// console.log(me.app);
		// console.log($rootScope);
// 		me.select = function (d, i) {
// console.log($scope.$parent.layout.qHyperCube.qDimensionInfo[0].qFallbackTitle);
// console.log(d.dimension);
// console.log($scope.$parent.layout.qHyperCube.qDimensionInfo[0].qFallbackTitle);
// 			// $scope.backendApi.selectValues(0, [d.qElemNumber], false);
			// me.app.field($scope.$parent.layout.qHyperCube.qDimensionInfo[0].qFallbackTitle).selectValues([d.dimension], true, true).then(function(reply){
			// 	console.log(reply);
			// });
		// }
	}];

	// me.template = template;


	// Custom Logger
	me.log = function (type, header, message) {
		if (type==='info') {
			console.info('%c ' + header + ': ', 'color: red', message);
		} else if (type==='error') {
			console.error('%c ' + header + ': ', 'color: red', message);
		} else {
			console.log('%c ' + header + ': ', 'color: red', message);
		}
	};

	return me;
});
