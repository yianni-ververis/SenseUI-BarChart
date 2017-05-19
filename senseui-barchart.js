/**
 * @name SenseUI-BarChart
 * @author yianni.ververis@qlik.com
 * @param {object} dimension - Field to get the data from
 * @param {string} id - Div id for scope manipulation
 * @param {string} title - Initial text for the dropdown
 * @description
 * 
 * @version 3.0.2: Added special symbols
 * @version 3.0.1: Increase speed with d3 v4
 * @version 2.1.3: Limit Results
 * @version 2.1.2: Changed Tooltip
 * @version 2.1.1: Split files. Fixed Tooltip
 * @version 2.1.0: Added Horizontal Bar Chart 
 * @version 2.0.0: Added Grouped Bar Chart 
 */

define([
	"qlik",
	"jquery",
	"qvangular",
	'underscore',
	'./lib/senseui-barchart-options',
	"css!./senseui-barchart.css",
	"./lib/d3.v4.min",
	"./lib/functions"
], function(qlik, $, qvangular, _, options, cssContent, d3) {
'use strict';
	// Define properties
	var me = options;
	
	// Get Engine API app for Selections
	me.app = qlik.currApp(this);
	
	me.support = {
		snapshot: true,
		export: true,
		exportData : false
	};

	me.paint = function($element,layout) {
		var vars = {
			v: '3.0.3', 
			id: layout.qInfo.qId,
			data: layout.qHyperCube.qDataPages[0].qMatrix.filter(d => d[1].qNum > 0),
			data2: layout.qHyperCube.qDataPages[0].qMatrix.filter(d => d[1].qNum > 0),
			height: $element.height(),
			width: $element.width(),
			qcx: layout.qHyperCube.qSize.qcx,
			stacked: (layout.qHyperCube.qSize.qcx > 2) ? true : false,
			color: (layout.vars.color)?layout.vars.color:'#000000',
			fontSize: (layout.vars.fontSize)?layout.vars.fontSize + 'px':'11px',
			precision: (!layout.vars.precision)? false : true,
			bar: {
				height: (layout.vars.bar.height)?layout.vars.bar.height:20,
				padding: (layout.vars.bar.spacing)?layout.vars.bar.spacing:3,
				border: layout.vars.bar.borderWeight,
				color: (layout.vars.bar.fillColor)?layout.vars.bar.fillColor:'#4477AA',
				colorHover: (layout.vars.bar.fillHoverColor)?layout.vars.bar.fillHoverColor:'#77b62a',
				textColor: (layout.vars.bar.textColor)?layout.vars.bar.textColor.split(','):['#000000'],
				textHoverColor: (layout.vars.bar.textHoverColor)?layout.vars.bar.textHoverColor.split(','):['#000000'],
				borderColor: (layout.vars.bar.borderColor)?layout.vars.bar.borderColor:'#404040',
				borderColorHover: (layout.vars.bar.borderColorHover)?layout.vars.bar.borderColorHover:'#77b62a',
				lollipop: (!_.isUndefined(layout.vars.bar.lollipop) && layout.vars.bar.lollipop)?true:false,
				grouped: (!_.isUndefined(layout.vars.bar.grouped) && layout.vars.bar.grouped)?true:false,
			},
			label: {
				visible: layout.vars.yaxis.visible,
				width: (layout.vars.yaxis.width) ? layout.vars.yaxis.width:150,
				characters: (layout.vars.yaxis.characters) ? layout.vars.yaxis.characters:50,
				rightPadding: (layout.vars.yaxis.rightPadding) ? layout.vars.yaxis.rightPadding:50,
				padding: 15,
				minWidth: 150
			},
			footer: {
				visible: layout.vars.xaxis.visible,
				height: 20
			},
			tooltip: {
				visible: (layout.vars.tooltip && layout.vars.tooltip.visible)?true:false,
				dimension: (layout.vars.tooltip && layout.vars.tooltip.dimension)?true:false,
				mashup: (layout.vars.tooltip && layout.vars.tooltip.mashup)?true:false,
				divid: (layout.vars.tooltip && layout.vars.tooltip.divid)? layout.vars.tooltip.divid : 'maincontent',
				scrollLeft: 0,
				scrollTop: 0,
			},
			symbol: {
				visible: (layout.vars.symbol && layout.vars.symbol.visible)?true:false,
				char: (layout.vars.symbol && layout.vars.symbol.char)? layout.vars.symbol.char : null,
			},
			canvasHeight: null,
			css: {
				breakpoint: 500,
			},
			legend: {
				height: 50,
				visible: (layout.vars.legend && layout.vars.legend.visible) ? true : false,
			},
			template: '',
			dimensionTitle: layout.qHyperCube.qDimensionInfo, 
			measureTitle: layout.qHyperCube.qMeasureInfo,
			verticalGridSpace: 60,
			verticalGridLines: null,
			enableSelections: (layout.vars.enableSelections)? true : false,
			palette: (layout.vars.bar.fillColor)? layout.vars.bar.fillColor.split(',') : ['#332288','#88CCEE','#117733','#DDCC77','#CC6677','#3399CC','#CC6666','#99CC66','#275378','#B35A01','#B974FD','#993300','#99CCCC','#669933','#898989','#EDA1A1','#C6E2A9','#D4B881','#137D77','#D7C2EC','#FF5500','#15DFDF','#93A77E','#CB5090','#BFBFBF'],
			limit: (layout.vars.limit) ? parseInt(layout.vars.limit) : 0,
			noData: (layout.vars.noData) ? layout.vars.noData : "No Data Available",
			this: this
		};
		
		// Limit results
		if (vars.limit) {
			vars.data = vars.data2 = vars.data.filter(function(element, index) {
				return index < vars.limit;
			})
		}
				
		vars.verticalGridLines = Math.round((vars.width-vars.label.width)/vars.verticalGridSpace);
		// For old uses of the extension
		// @TODO remove after we check all the mashups that use this extension
		if (_.isUndefined(layout.vars.tooltip) || _.isUndefined(layout.vars.tooltip.visible)) {
			vars.tooltip.visible = true;
		}

		// Create a lollipop chart
		if (vars.bar.lollipop) {
			vars.bar.height = 2;
			vars.bar.padding = 10;
		}

		// Toggle Stacked bar based on the grouped chart settings
		if (vars.bar.grouped) {
			vars.stacked = false;
		}

		// Add html template
		vars.template = '\
			<div qv-extension class="ng-scope senseui-barchart" id="' + vars.id + '">\
				<div class="content"></div>\
		';
		if (vars.footer.visible) {
			vars.template += '<div class="footer"></div>';
		};
		vars.template += '</div>';
		
		vars.data = vars.data.map(function(value, index) {
			return {
				"dimension": value[0].qText,
				"measure": value[1].qText,
				"measureNum": value[1].qNum,
				"qElemNumber": value[0].qElemNumber,
			}
		});
				
		// Add CSS
		vars.css.content = ' \
			#'+vars.id+' { \
				color: '+vars.color+' \
			} \
		';
		
		if (!$('.'+vars.id+'.d3-tip').length) { // insert only once
			$("<style>").html(vars.css.content).appendTo("head")
		}
		if (document.getElementById(vars.id)) {
			$element.empty();
		}
		
		// Check the height of the combines rects
		var calculatedHeight = vars.data2.length * (vars.bar.height + vars.bar.padding);
		
		// Adjust the label width based on viewport
		if (vars.width < vars.css.breakpoint) {
			// vars.label.width = vars.width*0.6;
			vars.label.width = vars.label.minWidth;
		}

		// $element.append($('<div />;').attr("id", vars.id).width(vars.width).height(vars.height).addClass('outer'));
		$element.append($(vars.template).width(vars.width).height(vars.height));
		if (vars.footer.visible) {
			$('#' + vars.id + ' .content').height(vars.height-vars.footer.height);
			$('#' + vars.id + ' .footer').height(vars.footer.height);
		} else {
			$('#' + vars.id + ' .content').height(vars.height);
		}

		// Get the first measure for max for now
		var dMax = d3.max(vars.data, function(d) { return d.measureNum; });

		// Loop through results
		var tempYpos = 0;
		for (var i = 0; i < vars.data2.length; i++) {
			vars.data2[i].total = 0;
			// Loop through the Measures in the results. 0 is assumed to be the Dimension
			for (var j = 0; j < vars.data2[i].length; j++) {
				if (j==0){
					vars.data2[i][j].qNum = 0;
				}
				vars.data2[i].total += (j>0)?vars.data2[i][j].qNum:0;
				// Assign the qElemNumber on every measure so we can access it from d3 on each element and enable selections
				vars.data2[i][j].qElemNumber = vars.data2[i][0].qElemNumber;
				vars.data2[i][j].ypos = i; // The parent array index
				// vars.data2[i][j].ypos = (vars.bar.grouped) ? tempYpos : i; // The parent array index
				vars.data2[i][j].xpos = 0; // The x position for the stacked bar
				vars.data2[i][j].dist = 0;
				vars.data2[i][j].width = 0;
				tempYpos += 1;
			}
		}
		var dMax2 = d3.max(vars.data2, function(d) { return d.total; });

		vars.canvasHeight = (vars.data2.length) ? vars.data2.length * (vars.bar.height+(vars.bar.padding*2)+3) : 20;

		var x = d3.scaleLinear()
			.domain([0,dMax2])
			.range([0, (vars.label.visible)?vars.width-vars.label.width-vars.label.rightPadding:vars.width]);

		var y = d3.scaleLinear()
			.domain([0, (!vars.stacked) ? vars.data2.length/(vars.qcx-1) : vars.data2.length])
			.range([10,vars.canvasHeight]);
		
		var svg = d3.select('#'+vars.id+' .content').append('svg');
		svg.attr("width", vars.width);
		svg.attr("height", (vars.bar.grouped && !vars.stacked && vars.data.length)?vars.canvasHeight*(vars.qcx-1):vars.canvasHeight);

		if (vars.footer.visible) {			
			var svgFooter = d3.select('#' + vars.id + ' .footer').append('svg');
			svgFooter.attr("width", vars.width);
			svgFooter.attr("height", vars.footer.height);
		}
		// TOOLTIPS
		if ($(`.${vars.id}.d3-tip`).length > 0) {
			$(`.${vars.id}.d3-tip`).remove();
		}

		var tooltip = d3.select("body").append("div").attr("class", vars.id + " d3-tip");
		var tooltipHtml = function (d,i) {
			// Flex
			var html = `
				<div class="tt-container">
			`;
			if (vars.tooltip.dimension) {
				html += '<div class="tt-row"><div class="tt-item-header">'+vars.data2[d.ypos][0].qText+'</div></div>';
			}
			html += ' \
					<div class="tt-row"> \
						<div class="tt-item-label"><div class="box" style="background-color: '+vars.bar.color+'"></div>'+vars.measureTitle[i-1].qFallbackTitle+':</div> \
						<div class="tt-item-value">'+roundNumber(vars, vars.data2[d.ypos][i].qText)+'</div> \
					</div> \
				</div> \
			';
			
			return html;
		}

		var	xAxis = d3.axisBottom(x);

		var	yAxis = d3.axisLeft(y)
			.tickSize(0)
			.tickFormat(function(d,i){
				return vars.data2[i][0].qText; 
			})
			.tickValues(d3.range(vars.data2.length)); 
			
		// Y Axis labels
	 	if (vars.label.visible && vars.data2.length){
			var y_xis = svg.append('g')
				.attr("transform", "translate("+vars.label.width+", -10)")
				.attr('id','yaxis')
				.attr('width', vars.label.width-10)
			y_xis.call(yAxis) //layout.qHyperCube.qSize.qcx 
				.selectAll("text")  
				.attr("x", -vars.label.width)
				.attr("y", (vars.bar.grouped) ? (vars.bar.height*vars.qcx)/2 : vars.label.padding) // SOLUTION 1 
				.attr('style', 'fill:' + vars.color + '; font-size:' + vars.fontSize + ';')
    			.style("text-anchor", "start")
				.call(wrap, vars.label.width, vars, d3);
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
					.tickFormat(function(d){
						return roundNumber(vars, d)
					})
			    );
		}

		// Position Indexes
		var xpos = 0;
		var ypos = 0;
		var yposText = 0;

		if (!vars.data.length) {
			svg.append('g').append('text')
				.attr("x", 0)             
				.attr("y", 20)
				.attr("text-anchor", "start")  
				.style("font-size", "12px")  
				.text(vars.noData)
		}

		//Create the Bars
		var bars2 = svg.selectAll(".content")
			.data(vars.data2)
			.enter().append("g")
			.attr("transform", "translate("+((vars.label.visible)?vars.label.width:0)+",-22)") //-20
			.attr('class','bars');

		bars2.selectAll('#' + vars.id + ' bars') //
			.append("rect")
			.data(function(e,j) { 
				return e; 
			})
			.enter().append("rect")
			.attr('style', function(d,i){
				return '\
					fill: ' + vars.palette[i-1] + '; \
					stroke-width:' + vars.bar.border + '; \
					stroke: ' + vars.bar.borderColor + ';\
					cursor: pointer;\
				';
			})
			.attr('width', function(d,i){
				if (vars.bar.grouped) {
					if(d.qNum!=='NaN' && i!=0) { // i=0 is the dimension legend
						var w = x(d.qNum)
						return (w>0)?w:0;
					}
				} else {
					if(d.qNum!=='NaN') {
						var w = x(d.qNum)
						return (w>0)?w:0;
					}
				}
			})
			.attr("x", function(d,i) {
				if (vars.bar.grouped && !vars.stacked) {
					return 0;
				} else {
					if (i==0) {
						xpos = 0;
						return 0;
					} else {
						if (d.qNum !=="NaN") {
							xpos += x(d.qNum); 
							return xpos - x(d.qNum);
						}
					}
				}
			})
			.attr('y', function(d,i){
				if (vars.bar.grouped && !vars.stacked) {
					if (i==0) { // Dimension / Label
						ypos = y(d.ypos);
					} else if (i==vars.qcx-1) {
						ypos += vars.bar.height + 20; 
						return ypos -20;
					} else {
						ypos += vars.bar.height; 
						return ypos;
					}
				} else {
					if(d.qNum!=='NaN') {
						return y(d.ypos)+19;
					}
				}
			})
			.attr("height", vars.bar.height)
			.on("mousemove", function(d,i){
				d3.select(this).style("fill", vars.bar.colorHover);
				d3.select(this).style("stroke", vars.bar.borderColorHover);
				d3.select(this).style("stroke-width", vars.bar.border);
				if (vars.tooltip.visible) {					
					if (vars.tooltip.mashup && vars.tooltip.divid && $('#'+vars.tooltip.divid).length>0) {
						vars.tooltip.scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft
						vars.tooltip.scrollTop = -$('#'+vars.tooltip.divid).offset().top;
					}
					tooltip
					// .style("left", vars.tooltip.scrollLeft + d3.event.pageX - 100 + "px")
					.style("left", vars.tooltip.scrollLeft + d3.event.pageX - ($('.'+vars.id + '.d3-tip').width() / 2) - 7 + "px")
					.style("top", vars.tooltip.scrollTop + d3.event.pageY - 70 + "px")
					.style("display", "inline-block")
					.html(tooltipHtml(d,i));
				}
			})
			.on("mouseout", function(d,i){ 
				tooltip.style("display", "none");
				d3.select(this).style("fill", vars.palette[i-1]);
				d3.select(this).style("stroke", vars.bar.borderColor);
			})
			.on('click', function(d,i) {
				tooltip.style("display", "none");
				if (vars.enableSelections) {
					vars.this.backendApi.selectValues(0, [d.qElemNumber], true);
				}
			});

		// Add the Text labels onto the Bars
		bars2.selectAll('#' + vars.id + ' bars') 
			.append('text')
			.data(function(d,j) { 
				return d; 
			})
			.enter().append("text")
			.text( function(d,i) {
				var xwidth = x(d.qNum);
				var textWidth = this.getBBox().width;
				if(d.qNum!=='NaN' && i>=0) {
					if(i>0 && vars.stacked) {
						// return d.qText;
						return roundNumber(d.qText);
					} else if (i>0 && !vars.stacked) {
						// return d.qText;
						return roundNumber(vars, d.qText);
					}
				} else {
					return null;
				}
			})
			.attr('x', function(d,i){
				if (i==0) {
					xpos = 0;
				} else {
					if (d.qNum !=="NaN") {
						var xwidth = x(d.qNum);
						var textWidth = this.getBBox().width;
						if(i>0 && vars.stacked) {
							xpos += xwidth; 
							return xpos - xwidth + (xwidth/2) - (textWidth/2);
						} else if (i>0 && vars.bar.grouped) {
							if (textWidth+(vars.bar.padding*2) > xwidth) {
								return xwidth + 5;
							} else {
								return (xwidth/2) - (textWidth/2);
							}
						} else {
							return xwidth + 5;
						}
					}
				}
			})
			.attr('y', function(d,i){
				if (vars.bar.grouped && !vars.stacked) {
					if (i==0) { // Dimension / Label
						yposText = y(d.ypos)+(vars.bar.height/2)+4;
					} else if (i==vars.qcx-1) {
						yposText += vars.bar.height + (vars.bar.height/2); 
						return yposText - (vars.bar.height/2);
					} else {
						yposText += vars.bar.height; 
						return yposText;
					}
				} else {
					if(d.qNum!=='NaN') {
						return y(d.ypos)+(vars.bar.height/2)+22;
					}
				}
			})
			.attr('style', function(d,i) {
				var xwidth = x(d.qNum);
				var textWidth = this.getBBox().width;
				var style = 'font-size:' + vars.fontSize + ';';
				if (vars.stacked) {
					var textColor = (vars.bar.textColor.length>1)?vars.bar.textColor[i-1]:vars.bar.textColor[0];
						style += 'fill: ' + textColor  + ';';
					if (xwidth<textWidth+5) { // add some padding to the text width
						style += 'visibility: hidden;';
					}
				} else {
					if (textWidth+(vars.bar.padding*2) > xwidth) {
						style += ' fill: ' + vars.color  + ';';
					} else {
						style += ' fill: ' + vars.bar.textHoverColor[0]  + ';';
					}
				}
				return style;
			})
			
		// Lollipop
		if (vars.bar.lollipop){
			bars2.selectAll('#' + vars.id + ' bars') 
				.append('path')
				.data(function(d,j) { 
					return d; 
				})
				.enter().append("path")
				.attr('style', function(d,i){
					return '\
						fill: ' + vars.palette[i-1] + '; \
						stroke-width:' + vars.bar.border + '; \
						stroke: ' + vars.bar.borderColor + ';\
					';
				})
				.attr("transform", function(d,i) { 
					if(i>0 && !vars.stacked) {
						return "translate(" +  (x(d.qNum)-5) + "," + (y(d.ypos)+20) + ")"; 
					}
				})
				.attr("d", d3.svg.symbol().size(128));
		}
		// Add legend
		if ((vars.stacked || vars.bar.grouped) && vars.legend.visible){
			var columnWidth = '148px';
			if (vars.width > 500) {
				columnWidth = (vars.width-10) / (vars.measureTitle.length) + 'px'; 
			}
			var legend = '\
				<div class="legend">';
			for (var i=0; i<vars.measureTitle.length; i++) {
				legend += '<div class="column" style="font-size:'+vars.fontSize+';width:'+columnWidth+'"><div class="box" style="background-color:'+vars.palette[i]+'"></div>'+vars.measureTitle[i].qFallbackTitle+'</div>';
			}
			legend += '</div>';
			$('#' + vars.id + ' .content').append(legend);	
		}

		// Add the legend line
		if (vars.data2.length) {
			svg.append("line")
				.attr('x1',vars.label.width)
				.attr('x2',vars.label.width)
				.attr("y1", 0)
				.attr("y2", vars.canvasHeight)
				.attr("stroke-width", 1)
				.attr("shape-rendering", "crispEdges")
				.attr("stroke", '#CCCCCC');
		}

		console.info(`%c SenseUI-BarChart ${vars.v}: `, 'color: red', `#${vars.id} Loaded!`);

		return qlik.Promise.resolve();
	};

	return me;
});