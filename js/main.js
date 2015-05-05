  var degree; // degree of separation where 0 is the original artist
  var limit = 1; // highest degree from main artist; max 5
  var frontier = [[],[]]; // keeping what needs to be visited (IDs)
  var visited = []; // keeping what has already been visited (IDs)
  var graph = {nodes: [], links: []};
  var starting_id = "04gDigrS5kc9YWfZHwBETP";
  var num_related = 10; // number [1,20]
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
  var samePrimary = false;

  // Dimensions for SVG
  var margin = {top: 40, bottom: 10, left: 20, right: 20};
  var width = 1400 - margin.left - margin.right;
  var height = 600 - margin.top - margin.bottom;

  var force = d3.layout.force()
        .charge(forceCharge)
        .friction(0.9)
        .size([width, height])
        .gravity(2.0);

  // Creates sources <svg> element and inner g (for margins)
  var svg = d3.select("body").append("svg")
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
      }

      // hover
      d3.selectAll(".node").on("mouseover", function (obj) {
        var info = d3.select(".info")
        d3.select(".header").select("#hovered")
          .text(obj.name.toUpperCase());
        info.select("#degree")
          .text(obj.degree);
      })

      d3.selectAll(".node").on("mouseout", function (obj) {
        var info = d3.select(".info");
        d3.select(".header").select("#hovered")
            .text("NONE");
        info.select("#degree")
            .text("None");
      })

      // click
      d3.selectAll(".node").on("click", function (obj) {
        samePrimary = true;
        var wait_30sec = null;
          clearTimeout(wait_30sec);

          queue()
            .defer(d3.json, baseUrl + obj.id + "/top-tracks?country=US") 
            .await(function(error, d) {
              playRandom(obj,d);
          })
      });

      // double click
      d3.selectAll(".node").on("dblclick", function (obj) {
        samePrimary = false;
        doubleClicked = true;
        currentNodeID = obj.id;
        refresh(obj.id);
      })

    }


/*************************************************************

  HELPER FUNCTIONS GO BELOW HERE...

  ***********************************************************/

  // function pushes the corresponding link into graph.links
  var getLinks = function (sourceID, targetID) {

    // variable to store index in graph.nodes of the artist we only have the ID for
    var sourceIndex;
    var targetIndex;

    for (var j = graph.nodes.length - 1; j >= 0; j--) {
            if (graph.nodes[j].id == sourceID)
              sourceIndex = j;
            if (graph.nodes[j].id == targetID)
              targetIndex = j;
    };
    
    graph.links.push({source: sourceIndex, target: targetIndex});
  }

  // function that populates songs
  var getSongs = function (tracks) {
    var len = tracks.length;
    tracks.forEach(function(track,i){
      d3.select(".info").select("#song" + (i+1))
        .text(track.name);

      for (var i = len; i < 10; i++) {
        d3.select(".info").select("#song" + (i+1))
          .text("");
      }
    })
  }

  // shuffles order
  var shuffle = function (num) {
    var array = [];
    console.log(num)
    for (var i = 0; i < num; i++)
      array[i] = i;

    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }

    return array;
  }

  // stops music
  var stopMusic = function() {
    d3.select(".info").selectAll(".song")
      .classed("playing",false);
    audio.pause();
    audio.currentTime = 0;
    curr_id = null;
  }

  // play song
  var playSong = function(num) {
    d3.select(".info").selectAll(".song")
      .classed("playing",false);
    d3.select(".info").select("#song" + (num+1))
      .classed("playing",true);

    var track = currTracks[num];
    audio.src = track.preview_url;

    // after 30 second preview, unhighlight
    wait_30sec = setTimeout(function (){
      d3.select(".info").select("#song" + (num+1))
      .classed("playing",false);
      }, 30500);

    audio.play();
  }

  var playRandom = function(obj,d) {
    d3.select(".info").selectAll(".song")
            .classed("playing",false);

    d3.select(".info").select("#clicked")
      .text(obj.name);

    if (click_id != obj.id) {
      click = 0;
      click_id = obj.id;

      currTracks = d.tracks;
      getSongs(currTracks);
      order = shuffle(currTracks.length);
    }

    if (currTracks.length == 1)
      var track_num = 0;
    else {
      var track_num = order[click % (currTracks.length - 1)];
      console.log(order);
    }


    var track = currTracks[track_num];
    d3.select(".info").select("#song" + (track_num+1))
      .classed("playing",true);
    audio.src = track.preview_url;

    // after 30 second preview, unhighlight
    wait_30sec = setTimeout(function (){
      d3.select(".info").select("#song" + (track_num+1))
      .classed("playing",false);
      }, 30500);

    audio.play();

    click += 1;
  }

  var refresh = function (id) {
    graph = {nodes: [], links: []};
    frontier = [[],[]]; // keeping what needs to be visited (IDs)
    visited = [];
    svg.selectAll("text").remove();
    start(id);
  }


  var changeNumNodes = function(number) {
    num_related = number;
    samePrimary = true;
    if (doubleClicked == true) {
      refresh(currentNodeID);
    }
    else if (curr_id == null) {
      refresh(starting_id);
    }
    else {
      refresh(curr_id);
    }
  }

  // Note to self: the degree that I'm thinking of is actually limit
  var changeDegreeNodes = function(newDegree) {
    limit = newDegree;
    samePrimary = true;
    if (doubleClicked == true) {
      refresh(currentNodeID);
    }
    else if (curr_id == null) {
      refresh(starting_id);
    }
    else {
      refresh(curr_id);
    }
  }

  var changeNodeSize = function(sizeOfNode) {
    nodeSize = sizeOfNode;
    samePrimary = true;
    if (doubleClicked == true) {
      refresh(currentNodeID);
    }
    else if (curr_id == null) {
      refresh(starting_id);
    }
    else {
      refresh(curr_id);
    }
  }

  var stopForceLayout = function() {
    force.stop();
  }

  var restartForceLayout = function() {
    force.start();
  }

  var changeCharge = function(newCharge) {
    forceCharge = newCharge;
    samePrimary = true;

    force = d3.layout.force()
        .charge(forceCharge)
        .friction(0.9)
        .size([width, height])
        .gravity(1.5);

    if (doubleClicked == true) {
      refresh(currentNodeID);
    }
    else if (curr_id == null) {
      refresh(starting_id);
    }
    else {
      refresh(curr_id);
    }
  }