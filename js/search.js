  var search = function () {
    var searched = document.getElementById("searchbar").value;
    if (searched == "") {
      return;
    }
    else {
      var artistPool = [];
      queue()
        .defer(d3.json, searchUrl + searched + "&type=artist")
        .await(function (error, data) {
          data.artists.items.forEach(function (item, i) {
            artistPool.push(item.name);
            $( "#searchbar" ).autocomplete({
              source: artistPool
            });            
          });
        })   
    }
  };

    var goSearch = function () {
    var searched = document.getElementById("searchbar").value;
    if (searched == "") {
      return;
    }
    else {

      queue()
        .defer(d3.json, searchUrl + searched + "&type=artist")
        .await(function (error, data) {
          curr_id = data.artists.items[0].id;
          // console.log(data)
          // console.log(data.artists.items[0].name + data.artists.items[0].id)        
          samePrimary = false;
          refresh(curr_id);
          primaryObj = data.artists.items[0];

          queue()
            .defer(d3.json, baseUrl + primaryObj.id + "/top-tracks?country=US") 
            .await(function(error, d) {
              playRandom(primaryObj,d);
            })
        })
    }
  };

  var goStartSearchHash = function () {
    var searched = document.getElementById("searchbar").value;
      if (searched == "") {
        return;
      }
    window.location.href = "index.html#" + searched;

  };

  var startSearchHash = function () {
    var artistNoHash = window.location.href.split('#')[1];
    queue()
        .defer(d3.json, searchUrl + artistNoHash + "&type=artist")
        .await(function (error, data) {
          curr_id = data.artists.items[0].id;
          // console.log(data)
          // console.log(data.artists.items[0].name + data.artists.items[0].id)        
          samePrimary = false;
          start(curr_id);
          primaryObj = data.artists.items[0];

          queue()
            .defer(d3.json, baseUrl + primaryObj.id + "/top-tracks?country=US") 
            .await(function(error, d) {
              playRandom(primaryObj,d);
            })
        })

     history.replaceState({}, document.title, "/main.html");
    }