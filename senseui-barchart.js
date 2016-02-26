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
	// d3.tip = factory(root.d3)

	// $("<style>").html(cssContent).appendTo("head");

	// Define properties
	var me = {
		initialProperties: {
			version: 1.0,
			qHyperCubeDef: {
				qDimensions: [],
				qMeasures: [],
				qInitialDataFetch: [{
					qWidth: 2,
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
					max: 1
				},
				sorting: {
					uses: "sorting"
				},
				settings : {
					uses : "settings",
					items: {
						bar: {
							type: "items",
							label: "Bar",
							items: {
								barFillColor: {
									type: "string",
									expression: "none",
									label: "Fill color",
									defaultValue: "#4477AA",
									ref: "custom.bar.fillColor"
								},
								barFillHoverColor: {
									type: "string",
									expression: "none",
									label: "Fill hover color",
									defaultValue: "#77b62a",
									ref: "custom.bar.fillHoverColor"
								},
								barBorderWeight: {
									type: "number",
									expression: "none",
									label: "Border weight",
									component: "slider",
									ref: "custom.bar.borderWeight",
									defaultValue: 0,
									min: 0,
									max: 3
								},
								barBorderColor: {
									type: "string",
									expression: "none",
									label: "Border color",
									defaultValue: "#404040",
									ref: "custom.bar.borderColor"
								},
								barSpacing: {
									type: "number",
									expression: "none",
									label: "Spacing",
									component: "slider",
									ref: "custom.bar.spacing",
									defaultValue: 3,
									min: 3,
									max: 10
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
									label: "On / Off",
									ref: "custom.xaxis.visible",
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
									ref: "custom.yaxis.visible",
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
		var vars = {
			id: layout.qInfo.qId,
			data: layout.qHyperCube.qDataPages[0].qMatrix,
			height: $element.height(),
			width: $element.width(),
			bar: {
				height: 20,
				padding: (layout.custom.bar.spacing)?layout.custom.bar.spacing:3,
				border: layout.custom.bar.borderWeight,
				color: (layout.custom.bar.fillColor)?layout.custom.bar.fillColor:'#4477AA',
				colorHover: (layout.custom.bar.fillHoverColor)?layout.custom.bar.fillHoverColor:'#77b62a',
				borderColor: (layout.custom.bar.borderColor)?layout.custom.bar.borderColor:'#404040'
			},
			label: {
				visible: layout.custom.yaxis.visible,
				width: 150,
				padding: 15
			},
			footer: {
				visible: layout.custom.xaxis.visible,
				height: 20
			},
			canvasHeight: null,
			template: '',
			dimensionTitle: layout.qHyperCube.qDimensionInfo[0].qFallbackTitle,
			measureTitle: layout.qHyperCube.qMeasureInfo[0].qFallbackTitle,
			verticalGridSpace: 60,
			verticalGridLines: null
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

		if (vars.width <= 200 && vars.label.visible) {
			vars.label.width = 50;
		} else if (vars.width <= 300 && vars.label.visible) {
			vars.label.width = 80;
		}

		vars.data = vars.data.map(function(d) {
			return {
				"dimension":d[0].qText,
				"measure":d[1].qText,
				"measureNum":d[1].qNum,
				"qElemNumber":d[0].qElemNumber,
			}
		});

		if (document.getElementById(vars.id)) {
			// $("#" + vars.id).empty();
			$element.empty();
		}

// console.log(vars);
// console.log(this);

		// $element.append($('<div />;').attr("id", vars.id).width(vars.width).height(vars.height).addClass('outer'));
		$element.append($(vars.template).width(vars.width).height(vars.height));
		if (vars.footer.visible) {
			$('#' + vars.id + ' .content').height(vars.height-vars.footer.height);
			$('#' + vars.id + ' .footer').height(vars.footer.height);
		} else {
			$('#' + vars.id + ' .content').height(vars.height);
		}

		var dMax = d3.max(vars.data, function(d) { return d.measureNum; });
		vars.canvasHeight = (vars.data.length * (vars.bar.height+(vars.bar.padding*2)));
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
			.domain([0,dMax])
			.range([0, (vars.label.visible)?vars.width-vars.label.width-(vars.label.padding*2):vars.width]);

		var y = d3.scale.linear()
			.domain([0,vars.data.length])
			.range([10,vars.canvasHeight]);

		// var colorScale = d3.scale.quantize()
		// 	.domain([0,data.length])
		// 	.range(colors);

		var svg = d3.select('#' + vars.id + ' .content')
			.append('svg')
			.attr({'width':vars.width,'height':vars.canvasHeight});

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
			.html(function(d) {
				var html = '\
					<div class="dimension">' + d.dimension + '</div>\
					<div class="measure">' + vars.measureTitle + ': ' + d.measure + '</div>\
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
				var label = vars.data[i].dimension;
				if (vars.label.width == 50) {
					label = label.substring(0,6);
				} else if (vars.label.width == 80) {
					label = label.substring(0,11);
				}
				return label; 
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
				.attr("transform", "translate("+vars.label.width+",10)")
				.attr('id','yaxis')
				.call(yAxis)
				.selectAll("text")  
					.style("text-anchor", "start")
					.attr("x", "-"+vars.label.width);
		}

		// X Axis labels
		if (vars.footer.visible) {
			var x_xis = svgFooter.append('g')
				.attr("transform", "translate("+((vars.label.visible)?vars.label.width:0)+",0)")
				.attr('id','xaxis')
				.call(xAxis
					.tickSize(1)
			    	.ticks(vars.verticalGridLines)
			    );
		}

		// Bars
		var chart = svg.append('g')
			.attr("transform", "translate("+((vars.label.visible)?vars.label.width:0)+",-20)") //-20
			.attr('id','bars')
			.selectAll('#' + vars.id + ' rect')
			.data(vars.data)
			.enter()
			.append('rect')
			.attr('height', function(d,i){ return vars.bar.height; })
			.attr({'x':0,'y':function(d,i){ return y(i)+19; }})
			.attr('style', '\
				fill: ' + vars.bar.color + '; \
				stroke-width:' + vars.bar.border + '; \
				stroke: ' + vars.bar.borderColor + ';\
				cursor: pointer;\
			')
			.attr('width',function(d){ 
				return x(d.measureNum);
			})
			.on('mouseover', function(d, i){
				d3.select(this).style("fill", vars.bar.colorHover); // 77b62a // 52cc52
				tip.show(d); 
			})
			.on('mouseout', function(d, i){
				tip.hide(); 
				d3.select(this).style("fill", vars.bar.color);
			})
			.on('click', function(d, i) {
				tip.hide();
				me.select(d);
			});

		var transit = d3.select("svg").selectAll('#' + vars.id + " rect")
		    .data(vars.data)
		    .transition()
		    .duration(1000) 
		    .attr("width", function(d) { return x(d.measureNum); });

		// Bar Text
		var transitext = d3.select('#' + vars.id + ' #bars')
			.selectAll('text')
			.data(vars.data)
			.enter()
			.append('text')
			.attr({'x':function(d) {
				return (x(d.measureNum)>60) ? x(d.measureNum)-50 : x(d.measureNum)+5; 
			},'y':function(d,i){ 
				return y(i)+34; 
			}})
			.text(function(d){ return d.measure; })
			.attr("class", function(d) { 
				return (x(d.measureNum)>60) ? 'barTextIn' : 'barTextOut';
			})
			.on('click', function(d, i) {
				me.select(d);
			});

		// me.select = function (d, i) {
		// 	this.backendApi.selectValues(0, [d.qElemNumber], false);
		// }
	};

	// Controller for binding
	me.controller =['$scope', '$rootScope', function($scope, $rootScope){
		// console.log($scope);
		// console.log($rootScope);
		me.select = function (d, i) {
			$scope.backendApi.selectValues(0, [d.qElemNumber], false);
		}
	}];

	// me.template = template;

	return me;
});
