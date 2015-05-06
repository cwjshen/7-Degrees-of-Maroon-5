 /* Main.js, needed to support the functionality of search.js. Pretty ugly design...
    but couldn't figure out a work around. Provides access to the global variables that search.js
    needs when being accessed from index.html. */

  var degree; // degree of separation where 0 is the original artist
  var limit = 4; // highest degree from main artist; max 5
  var frontier = [[],[]]; // keeping what needs to be visited (IDs)
  var visited = []; // keeping what has already been visited (IDs)
  var graph = {nodes: [], links: []};
  var starting_id = "04gDigrS5kc9YWfZHwBETP";
  var num_related = 3; // number [1,20]
  var baseUrl = "https://api.spotify.com/v1/artists/";
  var searchUrl = "https://api.spotify.com/v1/search?q=";
  var audio = new Audio();
  var curr_id = null;
  var deg_names = ["zero","one","two","three","four","five"];
  var nodeSize = 17;
  var currentNodeID = starting_id;
  var doubleClicked = false;
  var forceCharge = -5000;
  var currTracks = [];
  var click_id = null;
  var click = 0;
  var order = [];
  var primaryObj = {};
  var listenObj = {};
  var samePrimary = false;
  var click_deg = "zero";
  var deg_colors = ["#33B5E5","#FF4500","#98df8a","#FFBB33","#FF4444","#7E48E5"]
  var playing = true;
  var first_deg = [];

  // Dimensions for SVG
  var margin = {top: 40, bottom: 10, left: 20, right: 20};
  var width = 1400 - margin.left - margin.right;
  var height = 550 - margin.top - margin.bottom;

  var force = d3.layout.force()
        .charge(forceCharge)
        .friction(0.9)
        .size([width, height])
        .gravity(2.0);

  // Creates sources <svg> element and inner g (for margins)
  var svg = d3.select("#main").append("svg")
            .attr("width", width+margin.left+margin.right)
            .attr("height", height+margin.top+margin.bottom)

  // first run: grabbing THE artist
  var start = function (id) {
    queue()
        .defer(d3.json, "https://api.spotify.com/v1/artists/" + id) 
        .await(function(error, data) {
          data.degree = 0;
          graph.nodes.push(data);
          frontier[0].push(id);
          visited.push(id);
          degree = 0;
          primaryObj = data;
          barRender();
          first_deg = [];
          get_related ();
        });
  }

  var get_related = function () {
    if (degree < limit) {
      var q = queue();

      frontier[0].forEach(function (id) {
          q.defer(d3.json, "https://api.spotify.com/v1/artists/" + id + "/related-artists")
      }) // load all artists that need to be visited

      // does not run until all artists in frontier[0] have been loaded
      q.awaitAll(function (error, obj_array) { 
            
            if (error) return console.warn(error);

            obj_array.forEach(function (artist,i) {

              for (var j = 0; j < num_related; j++)
              {
                var rel_artist = artist.artists[j];

                if ( $.inArray(rel_artist.id, visited) < 0 ) {
                  rel_artist.degree = degree + 1;
                  graph.nodes.push(rel_artist); // add to nodes
                  frontier[1].push(rel_artist.id); // add to frontier
                  visited.push(rel_artist.id); // add to visited
                }

                // record first-degree artists
                if (degree == 0)
                  first_deg.push(rel_artist);

                getLinks(frontier[0][i],rel_artist.id);
              }
                
            }) // end obj_array forEach

            frontier.shift(); // truncates frontiers such that frontiers[1] = frontiers[0]
            frontier.push([]); // pushes empty array to end of frontier
            degree = degree + 1;
            get_related ();

        }) // end awaitall

    } // end if (degree < limit)

    if (degree == limit){
      d3.select(".header").select("#primary")
          .text(graph.nodes[0].name);
       
       render();
    }      
    } // end get_related

    // creates nodes and links
    var render = function () {
        var link = svg.selectAll(".link")
            .data(graph.links);

        link
          .enter().append("line");

        link
           .attr("class", "link");

        link
          .exit()
          .remove();

        var artist = svg.selectAll(".artist")
          .data(graph.nodes);

        var artist_enter = artist.enter()
                              .append("g")
                              .append("circle")

        var artist_names = artist
                        .append("text")
                        .attr("font-size", 14)
                        .text(function(d) { if (d.degree < 3) { return d.name} })

        artist
          .attr("class",function(d) {return "artist " + d.name})
        
        artist.select("circle")
          .attr("class", function (d) {return "node " + deg_names[d.degree]})
          .attr("id", function(d) {return d.name})
          .attr("r", function(d) {return nodeSize/(d.degree + 0.35)})

          artist
            .exit()
            .remove();

        var node = svg.selectAll(".node")
        .call(force.drag);

        force
        .nodes(graph.nodes)
        .links(graph.links)
        .start();

      force.on("tick", function(e) {
        link
        // .transition().duration(150)
        .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

          node
          // .transition().duration(150)
          .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });

          svg.selectAll("text")
            .attr("x", function(d) { return d.x; })
            .attr("y", function(d) { return d.y; }); 
      })

      if (!samePrimary) {
        queue()
          .defer(d3.json, baseUrl + primaryObj.id + "/top-tracks?country=US") 
          .await(function(error, d) {
            playRandom(primaryObj,d);
        })
        listenObj = primaryObj;
        barSetup();
      }

      // hover
      d3.selectAll(".node").on("mouseover", function (obj) {
        var info = d3.select(".info")
        d3.select(".header").select("#hovered")
          .text("Next, let's listen to music by " + obj.name + ".");
      })

      d3.selectAll(".node").on("mouseout", function (obj) {
        var info = d3.select(".info");
        d3.select(".header").select("#hovered")
            .text("");
      })

      // click
      d3.selectAll(".node").on("click", function (obj) {

        click_deg = this.className.baseVal.split(" ")[1];
        whenClick(obj);
      });

      // double click
      d3.selectAll(".node").on("dblclick", function (obj) {
        click_deg = "zero";
        whenDblClick(obj);
      })
    }

    // to make the initial settings already highlighted; if we don't want this, then we'll just comment this out.
      d3.select(".numberOfNodes").select("#num3")
          .classed("selected", true);
      d3.select(".degreeOfNodes").select("#deg4")
          .classed("selected", true);
      d3.select(".sizeOfNodes").select("#size17")
          .classed("selected", true);
      d3.select(".chargeOfNodes").select("#charge-5000")
          .classed("selected", true);
