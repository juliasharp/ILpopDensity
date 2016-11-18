var width = 960,
    height = 1100;

var formatNumber = d3.format(",d");

//correctly centers map
var projection = d3.geo.albers()
    .center([-88.5, 39])
    .rotate([3, 1])
    .parallels([40, -39]) 
    .scale(9000)
    .translate([(width / 2), (height / 2)]);

//calls the projection
var path = d3.geo.path()
    .projection(projection);


//var colors = d3.scale.threshold().range(colorbrewer.Greens[6]);

//defines bounds for colors/legend
var color = d3.scale.threshold()
    .domain([1, 10, 50, 100, 500, 1000, 2000, 5000])
    .range(["#fff7ec", "#fee8c8", "#fdd49e", "#fdbb84", "#fc8d59", "#ef6548", "#d7301f", "#b30000", "#7f0000"]);

//position encoding for the key only.
var x = d3.scale.linear()
    .domain([0, 5100])
    .range([0, 480]);

//Define x-axis
var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .tickSize(13)
    .tickValues(color.domain())
    .tickFormat(function(d) { return d >= 100 ? formatNumber(d) : null; });

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);


//Draw Legend
var legend = svg.append("g")
    .attr("class", "key")
    .attr("transform", "translate(20,700)");

//color values for 
legend.selectAll("rect")
    .data(color.range().map(function(d, i) {
      return {
        x0: i ? x(color.domain()[i - 1]) : x.range()[0],
        x1: i < color.domain().length ? x(color.domain()[i]) : x.range()[1],
        z: d
      };
    }))
  .enter().append("rect")
    .attr("height", 8)
    .attr("x", function(d) { return d.x0; })
    .attr("width", function(d) { return d.x1 - d.x0; })
    .style("fill", function(d) { return d.z; });

legend.call(xAxis).append("text")
    .attr("class", "caption")
    .attr("y", -6)
    .text("Population per square mile");


//Load JSON file
d3.json("il.json", function(error, il) {
  if (error) throw error;

  //get cencus tracts
  var tracts = topojson.feature(il, il.objects.tracts);

  // Clip tracts to land.
  svg.append("defs").append("clipPath")
      .attr("id", "clip-land")
    .append("path")
      .datum(topojson.feature(il, il.objects.counties))
      .attr("d", path);

  // Group tracts by color for faster rendering.
  svg.append("g")
      .attr("class", "tract")
      .attr("clip-path", "url(#clip-land)")
    .selectAll("path")
      .data(d3.nest()
        .key(function(d) { return color(d.properties.population / d.properties.area * 2.58999e6); })
        .entries(tracts.features.filter(function(d) { return d.properties.area; })))
    .enter().append("path")
      .style("fill", function(d) { return d.key; })
      .attr("d", function(d) { return path({type: "FeatureCollection", features: d.values}); });

  // Draw boundary between each county
  svg.append("path")
      .datum(topojson.mesh(il, il.objects.counties, function(a, b) { return a !== b; }))
      .attr("class", "county-border")
      .attr("d", path);
});

//d3.select(self.frameElement).style("height", height + "px");
