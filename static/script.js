current_section = 3;
global_type = 'wiggle';

window.onresize = function(event) {
    $("#sticker").css('width', $("#base").width()+20);
    $("#sticker").css('height', $(".section").height());

    $("#sticker").sticky({
        topSpacing : 100,
        bottomSpacing: $("footer").height() + 10,
    });
};

$(document).ready(function() {
    $("#fullpage").fullpage({
        autoScrolling: false,
        onLeave: function(index, nextIndex, direction){
            current_section = Math.floor(nextIndex/2)-1;
            console.log(current_section)

            var chart = charts[current_section];
            if (global_type == 'zero' && chart.type == 'wiggle') {
                chart.zero_transition();
            } else if (global_type == 'wiggle' && chart.type == 'zero') {
                chart.wiggle_transition();
            }

            idx = chart.get_idx();
            $("#title").text(chart.get_layer()[idx].title);
            $("#naver-link").attr("href", "http://movie.naver.com/movie/bi/mi/basic.nhn?code="+chart.get_layer()[idx].code);
            $("#poster").attr('src', chart.get_layer()[idx].url);
        }
    });

    $(".dropdown-button").dropdown();

    $("a.theme").click(function() {
        color = $(this).attr('id');

        if (color == "cyan") {
            color1 = "#006064",
            color2 = "#e0f7fa";
        } else if (color == "default") {
            color1 = "#045A8D",
            color2 = "#F1EEF6";
        } else if (color == "bg") {
            color1 = "#263238",
            color2 = "#eceff1";
        } else if (color == "teal") {
            color1 = "#004d40",
            color2 = "#e0f2f1";
        }
        for (var idx in charts) {
            chart = charts[idx];
            chart.update_color(color1, color2);
        }
    });

    $("#sticker").sticky({
        topSpacing : 100,
        bottomSpacing: $("footer").height() + 10,
    });

    $("#sticker").css('width', $("#base").width()+20);
    $("#sticker").css('height', $(".section").height());

    $('#graph-style input:radio').change( function(){
        console.log(current_section);

        var type = $(this).attr('id');
        var chart = charts[current_section];

        if (type == 'test1') {
            chart.wiggle_transition();
            global_type = 'wiggle';
        } else if (type == 'test2') {
            chart.zero_transition();
            global_type = 'zero';
        }
    });
});

var format = d3.time.format("%Y%m%d");
var format2 = d3.time.format("%b");

var charts = [];

zero_stack = d3.layout.stack()
    .offset("zero")
    //.offset("silhouette")
    .values(function(d) { return d.values; })
    .x(function(d) { return d.x; })
    .y(function(d) { return d.y; });

wiggle_stack = d3.layout.stack()
    .offset("wiggle")
    //.offset("silhouette")
    .values(function(d) { return d.values; })
    .x(function(d) { return d.x; })
    .y(function(d) { return d.y; });

var Chart = function(year) {
    var year = year;

    var margin = {top: 10, right: 10, bottom: 100, left: 20},
        margin2 = {top: 550, right: 10, bottom: 20, left: 20},
        width = $(".foxoffice").parent().width() - margin.left - margin.right - 3,
        height = 620 - margin.top - margin.bottom,
        height2 = 620 - margin2.top - margin2.bottom;

    var svg = d3.select("#"+year).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    var x = d3.scale.linear().range([0, width]),
        x2 = d3.scale.linear().range([0, width]),
        y = d3.scale.linear().range([height, 0]),
        y2 = d3.scale.linear().range([height2, 0]);

    var xAxis = d3.svg.axis().scale(x).orient("bottom")
        .ticks(3, function(d, i) {}),
        xAxis2 = d3.svg.axis().scale(x2).orient("bottom")
        .ticks(12, function(d, i) {});

    var brush = d3.svg.brush()
        .x(x2)
        .on("brush", brushed);

    function brushed() {
        x.domain(brush.empty() ? x2.domain() : brush.extent());
        focus.select(".x.axis").call(xAxis);
        focus.selectAll(".layer").attr("d", function(d) { return area(d.values); });
    };

    var color = d3.scale.linear()
        .range(["#045A8D", "#F1EEF6"]);

    var context_color = "#FC8D59";
    var context_idx = 0;

    this.get_idx = function() {
        return context_idx;
    }

    var area = d3.svg.area()
        //.interpolate("basis")
        .x(function(d) { return x(d.x); })
        .y0(function(d) { return y(d.y0); })
        .y1(function(d) { return y(d.y0 + d.y); });

    var area2 = d3.svg.area()
        .x(function(d) { return x2(d.x); })
        .y0(height2)
        .y1(function(d) { return y2(d.y); });

    var focus = svg.append("g")
        .attr("class", "focus")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    /*var vertical_line = d3.select("#"+year).append("div")
        .attr("class", "remove")
        .style("position", "absolute")
        .style("z-index", "19")
        .style("width", "1px")
        .style("height", height+"px")
        .style("top", margin.top+"px")
        .style("bottom", margin.bottom+"px")
        .style("left", "0px")
        .style("background", "rgba(255,255,255,0.5)");*/

    var tooltip = d3.select("#"+year)
        .append("div")
        .attr("class", "remove")
        .style("position", "absolute")
        .style("z-index", "20")
        .style("visibility", "hidden")
        .style("top", "20px")
        .style("left", "75px");

    var context = svg.append("g")
        .attr("class", "context")
        .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

    this.genre = 'comedy';

    this.get_json = function() {
        alert(this.genre);
        d3.json("./static/"+this.genre+"-"+year+".json", this.process);
    };

    this.change_genre = function(genre) {
        this.genre = genre;
        d3.json("./static/"+this.genre+"-"+year+".json", this.process);
    };

    var layers = [];
    var layers0 = [];

    this.get_layer = function() {
        return layers;
    }

    this.type = 'wiggle';

    this.zero_transition = function() {
        this.type = 'zero';
        zer = zero_stack(layers);
        y.domain([0, d3.max(zer, function(layer) { return d3.max(layer.values, function(d) { return  d.y0 + d.y; }); })+0.5]);
        focus.selectAll(".layer")
            .data(function() {
                return zer;
            })
            .transition()
            .duration(2500)
            .attr("d", function(d) { return area(d.values); });
    }

    this.wiggle_transition = function() {
        this.type = 'wiggle';
        wig = wiggle_stack(layers);
        y.domain([0, d3.max(wig, function(layer) { return d3.max(layer.values, function(d) { return  d.y0 + d.y; }); })]);
        focus.selectAll(".layer")
            .data(function() {
                return wig;
            })
            .transition()
            .duration(2500)
            .attr("d", function(d) { return area(d.values); });
    }

    this.transition = function() {
        focus.selectAll(".layer")
            .data(function() {
                d = layers0;
                layers0 = layers;
                return layers = d;
            })
            .transition()
            .duration(2500)
            .attr("d", function(d) { return area(d.values); });
    }

    this.update_color = function(color1, color2) {
        color = d3.scale.linear()
            .range([color1, color2]);

        color.domain([0, layers.length]);

        focus.selectAll("path")
            .style("fill", function(d) {
                if (d.idx == context_idx)
                    return context_color;
                else
                    return color(d.idx);
            });
    };

    var update_context = function(idx) {
        context_idx = idx;

        path = context.select("path");

        y2.domain([0, d3.max(layers[context_idx].values, function(value) {
            return value.y;
        })]);

        if (path[0][0] == null)
            path = context.append("path");
        
        path.datum(layers[idx])
            .attr("class", "area")
            .attr("d", function(d) { return area2(d.values); })
            .style("fill", function(d) { return context_color; });

        context.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height2 + ")")
            .call(xAxis2);

        focus.selectAll("path")
            .style("fill", function(d) {
                if (d.idx == idx)
                    return context_color;
                else
                    return color(d.idx);
            });
    };

    this.process = function(error, data) {
        mindate = format.parse(data['mindate']);
        maxdate = format.parse(data['maxdate']);
        skipdate = Number(data['skipdate']);
        y1 = data['y1'];

        xAxis.tickFormat(function(d) {
            date = new Date(mindate);
            date.setDate(mindate.getDate() + d*skipdate);
            return format2(date);
        });

        xAxis2.tickFormat(function(d) {
            date = new Date(mindate);
            date.setDate(mindate.getDate() + d*skipdate);
            return format2(date);
        });

        for (var idx in y1) {
            for (var jdx in y1[idx]) {
                if (typeof layers[idx] == 'undefined') {
                    a =  data['movies'][idx][1];
                    layers[idx] = {title : data['movies'][idx][2],
                                   url : data['movies'][idx][1][0],
                                   code : data['movies'][idx][0],
                                   idx : idx,values:[]};
                    layers0[idx] = {title : data['movies'][idx][1],
                                    code : data['movies'][idx][0],
                                    idx : idx,values:[]};
                }
                tmp = y1[idx][jdx];
                tmp = 1.0/tmp == Infinity ? 0 : 1.0/tmp;
                layers[idx].values.push({title:data['movies'][idx][1],
                                        x: Number(jdx),
                                        y: tmp});
                layers0[idx].values.push({title:data['movies'][idx][1],
                                        x: Number(jdx),
                                        y: 0});
            }
        }

        var n = layers.length,
            m = ((maxdate-mindate)/(1000*60*60*24)/skipdate);

        x.domain([0, m - 1]);
        x2.domain([0, m - 1]);
        y.domain([0, d3.max(wiggle_stack(layers), function(layer) { return d3.max(layer.values, function(d) { return  d.y0 + d.y; }); })]);

        color.domain([0, layers.length]);

        focus.selectAll(".layer")
            .data(wiggle_stack(layers))
            .enter().append("path")
            .attr("class", "layer")
            .attr("d", function(d) { return area(d.values); })
            .style("fill", function(d) {
                if (d.idx == context_idx)
                    return context_color;
                else
                    return color(d.idx);
            })
            .append("title")
            .text(function (d,i) { return d.title; });

        focus.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        update_context(0);

        context.append("g")
            .attr("class", "x brush")
            .call(brush)
        .selectAll("rect")
            .attr("y", -6)
            .attr("height", height2 + 7);

        svg.selectAll(".layer")
            .attr("opacity", 1)
            .on("mouseover", function(d, i) {
                change_poster_specific(d.title, d.code, d.url);
                /*svg.selectAll(".layer")
                    .attr("opacity", function(d, j) {
                        return j != i ? 0.8 : 1;
                    })

                mousex = d3.mouse(this);
                mousex = mousex[0] + 15;
                vertical_line.style("left", mousex + "px");*/
            })
            .on("mousemove", function(d, i){
                /*mousex = d3.mouse(this);
                mousex = mousex[0] + 15;
                vertical_line.style("left", mousex + "px" );

                current_x = Math.floor(x.invert(d3.mouse(this)[0]));
                var list = [];

                for (var idx in layers) {
                    layer = layers[idx];

                    list.push(layer.values[current_x]);
                }

                var sorted = list.sort(function (a,b) { return (b.y > a.y); });

                body = ''

                for (var idx in [0,1,2,3,4]) {
                    body += sorted[idx].title[1] + '<br>';
                }

                html =  "<p>" + body + "</p>";
                tooltip.html(html).style("visibility", "visible");*/
            })
            .on("click", function(d, i) {
                update_context(d.idx);
                change_poster();
            })
            .on("mouseout", function(d, i) {
                svg.selectAll(".layer")
                    .attr("opacity", "1");
                d3.select(this)
                    .classed("hover", false)
                    .attr("stroke-width", "0px");

                /*html =  "<p>" + d.title + "<br>" + d.code + "</p>";
                tooltip.html(html).style("visibility", "hidden");*/
            });
        change_poster();
    };

    var change_poster = function() {
        $("#title").text(layers[context_idx].title);
        $("#naver-link").attr('href', "http://movie.naver.com/movie/bi/mi/basic.nhn?code="+layers[context_idx].code);
        $("#poster").attr('src', layers[context_idx].url);
    }

    var change_poster_specific = function(title, code, url) {
        $("#title").text(title);
        $("#naver-link").attr('href', "http://movie.naver.com/movie/bi/mi/basic.nhn?code="+code);
        $("#poster").attr('src', url);
    }
};

$(".foxoffice").each(function() {
    year = $(this).attr('id');

    chart = new Chart(year);
    chart.get_json();
    charts.push(chart);
});
