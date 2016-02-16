define([
	"qlik",
	"jquery",
	"qvangular",
	'underscore',
	"core.utils/theme",
	"text!./senseui-barchart.css",
	"text!./template.html",
	// "./d3.min",
	'./d3-tip'
], function(qlik, $, qvangular, _, Theme, cssContent, template) {
'use strict';
	// d3.tip = factory(root.d3)

	$("<style>").html(cssContent).appendTo("head");
	// $("<link/>", {
	// 	rel: "stylesheet",
	// 	type: "text/css",
	// 	href: require.toUrl( "extensions/senseui-barchart/senseui-barchart.css")
	// }).appendTo("head");

	// $("<script/>", {
	// 	src: require.toUrl( "extensions/senseui-barchart/d3-tip/index.js")
	// }).appendTo("head");

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
						Chart: {
							type: "items",
							label: "Settings",
							items: {
								btnBgColor: {
									type: "string",
									expression: "optional",
									component: "color-picker",
									label: "Button Background Color",
									ref: "btnBgColor",
									defaultValue: 10
								},
							}
						}
					}
				}
			}
		}
	};
	
	// Get Engine API app for Selections
	me.app = qlik.currApp(this);

	me.paint = function($element,layout) {
		var vars = {
			id: layout.qInfo.qId,
			data: layout.qHyperCube.qDataPages[0].qMatrix,
			height: $element.height(),
			width: $element.width(),
			bar: {
				height: 20,
				padding: 3
			},
			label: {
				width: 150,
				padding: 15
			},
			footer: {
				height: 20
			},
			canvasHeight: null,
			template: '',
			dimensionTitle: layout.qHyperCube.qDimensionInfo[0].qFallbackTitle,
			measureTitle: layout.qHyperCube.qMeasureInfo[0].qFallbackTitle,
			verticalGridSpace: 50,
			verticalGridLines: null
		};
		vars.verticalGridLines = Math.round((vars.width-vars.label.width)/vars.verticalGridSpace);
		vars.template = '\
			<div qv-extension class="ng-scope senseui-barchart" id="' + vars.id + '">\
				<div class="content"></div>\
				<div class="footer"></div>\
			</div>\
		';

		if (vars.width <= 300) {
			vars.label.width = 80;
		}
console.log(vars);
		vars.data = vars.data.map(function(d) {
			return {
				"dimension":d[0].qText,
				"measure":d[1].qNum,
				"qElemNumber":d[0].qElemNumber,
			}
		});

		if (document.getElementById(vars.id)) {
			// $("#" + vars.id).empty();
			$element.empty();
		}

		// $element.append($('<div />;').attr("id", vars.id).width(vars.width).height(vars.height).addClass('outer'));
		$element.append($(vars.template).width(vars.width).height(vars.height));
		$('.senseui-barchart .content').height(vars.height-vars.footer.height);
		$('.senseui-barchart .footer').height(vars.footer.height);

		var dMax = d3.max(vars.data, function(d) { return d.measure; });
		vars.canvasHeight = vars.data.length * (vars.bar.height+(vars.bar.padding*2));
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
			.range([0, vars.width-vars.label.width-(vars.label.padding*2)]);

		var y = d3.scale.linear()
			.domain([0,vars.data.length])
			.range([10,vars.canvasHeight]);

		// var colorScale = d3.scale.quantize()
		// 	.domain([0,data.length])
		// 	.range(colors);

		var svg = d3.select('#' + vars.id + ' .content')
			.append('svg')
			.attr({'width':vars.width,'height':vars.canvasHeight+30});

		var svgFooter = d3.select('#' + vars.id + ' .footer')
			.append('svg')
			.attr({'width':vars.width,'height':vars.footer.height});

		// Create Parent Group layering
		svg.append("g").attr("id", "grid");

		// Draw the tooltip
		if ($('.d3-tip').length > 0) {
			$('.d3-tip').remove();
		}
		var tip = d3.tip()
			.attr('class', 'd3-tip')
			.offset([-10, 0])
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
			.orient('bottom')
			.tickSize(1)
		    .ticks(vars.verticalGridLines);

		var	yAxis = d3.svg.axis()
			.scale(y)
			.orient('left')
			.tickSize(1)
			.tickFormat(function(d,i){ return vars.data[i].dimension; })
			.tickValues(d3.range(vars.data.length)); //1167

		// Vertical Gray Grid Lines
		// svg.select("#grid")
		// 	.append("g")
	 //        .attr("class", "grid")
	 //        .attr("transform", "translate(" + vars.label.width + ",10)")
	 //        .call(xAxis
	 //            .tickSize(-vars.height, 0, 0)
	 //            .tickFormat("")
	 //        );

		// Y Axis labels
		var y_xis = svg.append('g')
			.attr("transform", "translate("+vars.label.width+",10)")
			.attr('id','yaxis')
			.call(yAxis);

		// X Axis labels
		var x_xis = svgFooter.append('g')
			.attr("transform", "translate("+vars.label.width+",0)")
			.attr('id','xaxis')
			.call(xAxis);

		// Bars
		var chart = svg.append('g')
			.attr("transform", "translate("+vars.label.width+",-20)")
			.attr('id','bars')
			.selectAll('rect')
			.data(vars.data)
			.enter()
			.append('rect')
			.attr('height', function(d,i){ return vars.bar.height; })
			.attr({'x':0,'y':function(d,i){ return y(i)+19; }})
			.attr('class', 'bar')
			.attr('width',function(d){ 
				return x(d.measure);
			})
			.on('mouseover', function(d, i){
				tip.show(d, i); 
			})
			.on('mouseout', tip.hide)
			.on('click', function(d, i) {
				console.log(1);
				tip.hide;
				me.select(d);
			});

		var transit = d3.select("svg").selectAll("rect")
		    .data(vars.data)
		    .transition()
		    .duration(1000) 
		    .attr("width", function(d) { return x(d.measure); });

		// Bar Text
		var transitext = d3.select('#bars')
			.selectAll('text')
			.data(vars.data)
			.enter()
			.append('text')
			.attr({'x':function(d) {
				return (x(d.measure)>60) ? x(d.measure)-50 : x(d.measure)+5; 
			},'y':function(d,i){ 
				return y(i)+34; 
			}})
			.text(function(d){ return d.measure; })
			.attr("class", function(d) { 
				return (x(d.measure)>60) ? 'barTextIn' : 'barTextOut';
			})
			.on('click', function(d, i) {
				me.select(d);
			});
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
