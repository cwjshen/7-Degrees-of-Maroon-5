/*************************************************************

  HELPER FUNCTIONS GO BELOW HERE...

  ***********************************************************/

  // function that abstracts out the functionality of a click
  // for use for the forward button and for clicking on node
  var whenClick = function (obj) {
    samePrimary = true;
    playing = true;
    listenObj = obj;
    barRender();
    var wait_30sec = null;
      clearTimeout(wait_30sec);

      queue()
        .defer(d3.json, baseUrl + obj.id + "/top-tracks?country=US") 
        .await(function(error, d) {
          playRandom(obj,d);
      })
  }

  // function that abstracts out the functionality of a double click
  // for use for playNextArtist and for double clicking a node
  var whenDblClick = function (obj) {
    samePrimary = false;
    doubleClicked = true;
    currentNodeID = obj.id;
    primaryObj = obj;
    listenObj = primaryObj;
    refresh(obj.id);
  }

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

  // function that populates songs on left sidebar
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

  // function that shuffles order
  // ensures two of same songs won't be played in succession
  var shuffle = function (num) {
    var array = [];
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
    playing = false;
  }

  // pauses or plays music
  var playPauseMusic = function() {
    if (playing) {
      playing = false;
      audio.pause();
    } else if (audio.currentTime > 0) {
      playing = true;
      audio.play();
    } else {
      playing = true;
      whenClick(listenObj);
    }
  }

  // picks random first-degree related artist
  // as new primary artist
  var playNextArtist = function() {
    var num_firstdeg = first_deg.length;
    var index = Math.floor((Math.random() * num_firstdeg))
    click_deg = "zero";
    listenObj = primaryObj;
    console.log("index: " + index)
    var randArtist = first_deg[index]
    whenDblClick(randArtist);
  }

  // play song based on clicks on titles in left sidebar
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

  // function that plays a random song
  // used in forward button and click node functionality
  var playRandom = function(obj,d) {
    d3.select(".info").selectAll(".song")
            .classed("playing",false);

    d3.select(".info").select("#clicked")
      .text(function () {return obj.name + "'s Top Tracks"});

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

  // sets up the bar chart
  var barSetup = function () {
    var magin = {top: 20, left: 20, bottom: 20, right: 20};
    var width = 600, barHeight = 20;
    var scaleHeight = 20;

    x_scale = d3.scale.linear()
        .range([0, width])
        .domain([0,100]);

    var xAxis = d3.svg.axis()
      .scale(x_scale)
      .ticks(5);

    var chart = d3.select("#chart")
        .attr("width", width + margin.left + margin.right);

    data = [{name: primaryObj.name, popularity: primaryObj.popularity},
            {name: listenObj.name, popularity: listenObj.popularity}]

    chart.attr("height", barHeight * data.length + scaleHeight);

    var bar = chart.selectAll("g")
        .data(data)
      .enter().append("g")
        .attr("transform", function(d, i) { return "translate(" + margin.left + "," + i * barHeight + ")"; });

    bar.append("rect")
        .attr("class","hello")
        .attr("width", function(d) { return x_scale(d.popularity); })
        .attr("fill", deg_colors[0])
        .attr("height", barHeight - 1);

    bar.append("text")
        .attr("class","textname")
        .attr("y", barHeight / 2)
        .attr("dy", ".35em")
        .attr("text-anchor","start")
        .attr("fill","#fff")
        .attr("font-size","12pt")
        .text(function(d) { return d.name; });

    bar.append("text")
        .attr("class","textpop")
        .attr("x", function(d) { return x_scale(d.popularity) + 3})
        .attr("y", barHeight / 2)
        .attr("dy", ".35em")
        .attr("text-anchor","start")
        .attr("fill","#000")
        .attr("font-size","12pt")
        .text(function(d) { return d.popularity; });

    var axis = chart.append("g")
      .attr("class","x-axis")
      .attr("fill", "#000")
      .attr("transform", "translate("+ margin.left + ", 40)")
      .call(xAxis);
  }

  var barRender = function () {
    var barHeight = 20;

    data = [{name: primaryObj.name, popularity: primaryObj.popularity},
            {name: listenObj.name, popularity: listenObj.popularity}]

    var bar = d3.select("#chart").selectAll("g")
        .data(data)

    bar.select("rect")
    .transition().duration(500)
      .attr("width", function(d) { return x_scale(d.popularity); })
      .attr("fill", function(d,i) {
          if (i != 0){
            var color;
            console.log(click_deg)
            deg_names.forEach(function (name,j){
              if (name == click_deg){
                color = deg_colors[j];
              }
            })
            return color;
          } else {
            return deg_colors[0]
          }
      })
      
    bar.select(".textname")
    .transition().duration(500)
      .attr("y", barHeight / 2)
      .attr("dy", ".35em")
      .attr("text-anchor","start")
      .attr("fill","#fff")
      .attr("font-size","12pt")
      .text(function(d) { return d.name; });

    bar.select(".textpop")
        .transition().duration(500)
        .attr("x", function(d) { return x_scale(d.popularity) + 3})
        .attr("y", barHeight / 2)
        .attr("dy", ".35em")
        .attr("text-anchor","start")
        .attr("fill","#000")
        .attr("font-size","12pt")
        .text(function(d) { return d.popularity; });

    d3.select("#chart").select(".x-axis")
      .transition().duration(500)
        .attr("fill", "#000")
  }

  // refreshes variables for new primary artist
  var refresh = function (id) {
    graph = {nodes: [], links: []};
    frontier = [[],[]]; // keeping what needs to be visited (IDs)
    visited = [];
    svg.selectAll("text").remove();
    d3.selectAll(".x-axis").transition().duration(500).remove();
    start(id);
  }

  // changes number of related artists to display for a given node
  var changeNumNodes = function(number) {
    d3.select(".numberOfNodes").selectAll(".numberNodes")
      .classed("selected", false);
    d3.select(".numberOfNodes").select("#num" + (number))
      .classed("selected", true);
      
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

  // changes the maximum degree related artist
  var changeDegreeNodes = function(newDegree) {
    d3.select(".degreeOfNodes").selectAll(".degreeNodes")
      .classed("selected", false);
    d3.select(".degreeOfNodes").select("#deg" + (newDegree))
      .classed("selected", true);

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

  // changes the size of the nodes
  var changeNodeSize = function(sizeOfNode) {
    d3.select(".sizeOfNodes").selectAll(".sizeNodes")
      .classed("selected", false);
    d3.select(".sizeOfNodes").select("#size" + (sizeOfNode))
      .classed("selected", true);

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

  // changes the charge between nodes in force layout
  var changeCharge = function(newCharge) {
    d3.select(".chargeOfNodes").selectAll(".chargeNodes")
      .classed("selected", false);
    d3.select(".chargeOfNodes").select("#charge" + (newCharge))
      .classed("selected", true);

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