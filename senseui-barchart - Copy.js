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
		var qMatrix = layout.qHyperCube.qDataPages[0].qMatrix,
			html = '',
			height = $element.height(),
			width = $element.width(),
			bar = {
				height: 20,
				padding: 3
			},
			label = {
				width: 150,
				padding: 15
			},
			id = layout.qInfo.qId,
			categories=[],
			dollars = [],
			colors = ['#4477AA'],
			verticalGridLines = parseInt((width-label.width)/50);

		if (width <= 300) {
			label.width = 80;
		}

		var data = qMatrix.map(function(d) {
			return {
				"dimension":d[0].qText,
				"measure":d[1].qNum
			}
		});
console.log(data);
		$.each(qMatrix, function(key, value) {
			categories.push(value[0].qText);
			dollars.push((value[1].qNum>0)?value[1].qNum:0); 
		});

		if (document.getElementById(id)) {
			$("#" + id).empty();
		}

		$element.append($('<div />;').attr("id", id).width(width).height(height).addClass('outer'));

		var dMax = d3.max(dollars, function(d) { return d; });
		var canvasHeight = categories.length * (bar.height+(bar.padding*2));
// console.log(verticalGridLines);
		var grid = d3.range(verticalGridLines).map(function(i){
			return {'x1':0,'y1':0,'x2':0,'y2':canvasHeight};
		});
// console.log(dMax); //tickvalues = dmax / number of vertical grid lines
		var tickVals = grid.map(function(d,i){
			if(i>0){ return i*10; }
			else if(i===0){ return "100";}
		});

		var xscale = d3.scale.linear()
			.domain([0,dMax])
			// .domain([0,600])
			.range([0, width-label.width-(label.padding*2)]);

		var yscale = d3.scale.linear()
			.domain([0,categories.length])
			.range([10,canvasHeight]);

		var colorScale = d3.scale.quantize()
			.domain([0,categories.length])
			.range(colors);

		var canvas = d3.select('#' + id)
			.append('svg')
			.attr({'width':width,'height':canvasHeight+30});

		// Draw the tooltip
		var tip = d3.tip()
			.attr('class', 'd3-tip')
			.offset([-10, 0])
			.html(function(d) {
				console.log(d);		
				var html = '<div class="d3-tip2">TEST</div>';

				return html;
			})

		canvas.call(tip);

		// Vertical Gray Grid Lines
		var grids = canvas.append('g')
			.attr('id','grid')
			.attr('transform','translate('+label.width+',10)')
			.selectAll('line')
			.data(grid)
			.enter()
			.append('line')
			.attr({'x1':function(d,i){ return i*30; },
				 'y1':function(d){ return d.y1; },
				 'x2':function(d,i){ return i*30; },
				 'y2':function(d){ return d.y2; },
			})
			.style({'stroke':'#adadad','stroke-width':'1px'});

		var	xAxis = d3.svg.axis();
			xAxis
				.orient('bottom')
				.scale(xscale)
				.tickValues(tickVals);

		var	yAxis = d3.svg.axis();
			yAxis
				.orient('left')
				.scale(yscale)
				.tickSize(1)
				.tickFormat(function(d,i){ return categories[i]; })
				.tickValues(d3.range(categories.length)); //1167

		// Y Axis labels
		var y_xis = canvas.append('g')
			.attr("transform", "translate("+label.width+",10)")
			.attr('id','yaxis')
			.call(yAxis);

		// X Axis labels
		var x_xis = canvas.append('g')
			.attr("transform", "translate("+label.width+","+(canvasHeight+10)+")")
			.attr('id','xaxis')
			.call(xAxis);

		// Bars
		var chart = canvas.append('g')
			.attr("transform", "translate("+label.width+",-20)")
			.attr('id','bars')
			.selectAll('rect')
			.data(dollars)
			.enter()
			.append('rect')
			.attr('height', function(d,i){ return bar.height; })
			.attr({'x':0,'y':function(d,i){ return yscale(i)+19; }})
			// .style('fill',function(d,i){ return colorScale(1); })
			.attr('class', 'bar')
			.attr('width',function(d){ 
				// return 0;
				return xscale(d);
			})
			.on('mouseover', function(d, i){
				// console.log(d);
				// console.log(i);
				//save the moused-over graphical element in a variable
				var rect = this;
				tip.show(d, i); //show the tip (will call the .html function)
				// tip.attr('class', function(){
				// 	if ($('body').width() < (rect.getScreenCTM().e + 70)) {
				// 		return 'd3-tip n left';
				// 	} else {
				// 		return 'd3-tip n';
				// 	}
				// })
				// $("div[qva-chart-tooltip]").css('display', 'block');
			})
			.on('mouseout', tip.hide);

		var transit = d3.select("svg").selectAll("rect")
		    .data(dollars)
		    .transition()
		    .duration(1000) 
		    .attr("width", function(d) { return xscale(d); });

		// Bar Text
		var transitext = d3.select('#bars')
			.selectAll('text')
			.data(dollars)
			.enter()
			.append('text')
			.attr({'x':function(d) {
				return (xscale(d)>60) ? xscale(d)-50 : xscale(d)+5; 
			},'y':function(d,i){ 
				return yscale(i)+34; 
			}})
			.text(function(d){ return d; })
			// .style({'font-size':'14px'})
			.attr("class", function(d) { 
				return (xscale(d)>60) ? 'barTextIn' : 'barTextOut';
			})
	};


	// Controller for binding
	me.controller =['$scope', '$rootScope', function($scope, $rootScope){
		// console.log($scope);
		// console.log($rootScope);
		// $rootScope.showTooltip();
	}];

	me.paintWorking = function($element,layout) {
		var qMatrix = layout.qHyperCube.qDataPages[0].qMatrix,
			html = '',
			height = $element.height(),
			width = $element.width(),
			id = layout.qInfo.qId;

		if (document.getElementById(id)) {
			$("#" + id).empty();
		}
		$element.append($('<div />;').attr("id", id).width(width).height(height).addClass('outer'));

		var categories= ['','Accessories', 'Audiophile', 'Camera & Photo', 'Cell Phones', 'Computers','eBook Readers','Gadgets','GPS & Navigation','Home Audio','Office Electronics','Portable Audio','Portable Video','Security & Surveillance','Service','Television & Video','Car & Vehicle'];

		var dollars = [213,209,190,179,156,209,190,179,213,209,190,179,156,209,190,190];

		var colors = ['#0000b4','#0082ca','#0094ff','#0d4bcf','#0066AE','#074285','#00187B','#285964','#405F83','#416545','#4D7069','#6E9985','#7EBC89','#0283AF','#79BCBF','#99C19E'];

		var grid = d3.range(25).map(function(i){
			return {'x1':0,'y1':0,'x2':0,'y2':width};
		});

		var tickVals = grid.map(function(d,i){
			if(i>0){ return i*10; }
			else if(i===0){ return "100";}
		});

		var xscale = d3.scale.linear()
			.domain([10,250])
			.range([0,722]);

		var yscale = d3.scale.linear()
			.domain([0,categories.length])
			.range([0,480]);

		var colorScale = d3.scale.quantize()
			.domain([0,categories.length])
			.range(colors);

		var canvas = d3.select('#' + id)
			.append('svg')
			.attr({'width':900,'height':550});

		var grids = canvas.append('g')
			.attr('id','grid')
			.attr('transform','translate(150,10)')
			.selectAll('line')
			.data(grid)
			.enter()
			.append('line')
			.attr({'x1':function(d,i){ return i*30; },
				 'y1':function(d){ return d.y1; },
				 'x2':function(d,i){ return i*30; },
				 'y2':function(d){ return d.y2; },
			})
			.style({'stroke':'#adadad','stroke-width':'1px'});

		var	xAxis = d3.svg.axis();
			xAxis
				.orient('bottom')
				.scale(xscale)
				.tickValues(tickVals);

		var	yAxis = d3.svg.axis();
			yAxis
				.orient('left')
				.scale(yscale)
				.tickSize(2)
				.tickFormat(function(d,i){ return categories[i]; })
				.tickValues(d3.range(17));

		var y_xis = canvas.append('g')
			.attr("transform", "translate(150,0)")
			.attr('id','yaxis')
			.call(yAxis);

		var x_xis = canvas.append('g')
			.attr("transform", "translate(150,480)")
			.attr('id','xaxis')
			.call(xAxis);

		var chart = canvas.append('g')
			.attr("transform", "translate(150,0)")
			.attr('id','bars')
			.selectAll('rect')
			.data(dollars)
			.enter()
			.append('rect')
			.attr('height',19)
			.attr({'x':0,'y':function(d,i){ return yscale(i)+19; }})
			.style('fill',function(d,i){ return colorScale(i); })
			.attr('width',function(d){ return 0; });


		var transit = d3.select("svg").selectAll("rect")
		    .data(dollars)
		    .transition()
		    .duration(1000) 
		    .attr("width", function(d) { return xscale(d); });

		var transitext = d3.select('#bars')
			.selectAll('text')
			.data(dollars)
			.enter()
			.append('text')
			.attr({'x':function(d) {return xscale(d)-200; },'y':function(d,i){ return yscale(i)+35; }})
			.text(function(d){ return d+"$"; }).style({'fill':'#fff','font-size':'14px'});
	};

	me.paint2 = function($element,layout) {
		var qMatrix = layout.qHyperCube.qDataPages[0].qMatrix,
			html = '',
			height = $element.height(),
			width = $element.width(),
			id = layout.qInfo.qId;;

		var data = qMatrix.map(function(d) {
			return {
				"dimension":d[0].qText,
				"measure":d[1].qNum
			}
		});

		if (document.getElementById(id)) {
			$("#" + id).empty();
		}
		$element.append($('<div />;').attr("id", id).width(width).height(height).addClass('outer'));

		var margin = {top: 0, right: 0, bottom: 30, left: 40},
			width = width - margin.left - margin.right,
			height = height - margin.top - margin.bottom;

		var x = d3.scale.ordinal()
			.rangeBands([0, width], .1);

		var y = d3.scale.linear()
			.range([height, 0]);

		var xAxis = d3.svg.axis()
			.scale(x)
			.orient("bottom");

		var yAxis = d3.svg.axis()
			.scale(y)
			.orient("left");

		var svg = d3.select("#"+id).append("svg")
		        .attr("width", width + margin.left + margin.right)
		        .attr("height", height + margin.top + margin.bottom)
			.append("g")
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		x.domain(data.map(function(d) { return d.dimension; }));
		y.domain([0, d3.max(data, function(d) { return d.measure; })]);

		svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + height + ")")
			.call(xAxis);

		svg.append("g")
			.attr("class", "y axis")
			.call(yAxis);

		svg.selectAll(".bar")
			.data(data)
		.enter().append("rect")
			.attr("class", "bar")
			.attr("x", function(d) { return x(d.dimension); })
			.attr("width", x.rangeBand())
			.attr("y", function(d) { return y(d.measure); })
			.attr("height", function(d) { return height - y(d.measure); });
	};

	return me;
});
