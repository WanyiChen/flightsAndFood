let root_url = "http://comp426.cs.unc.edu:3001/";
let city='';
let trip_type="round trip";
let airport_names=[];
let airport_codes=[];
let select1,select2=''; //selected to and return flights
let trips = [];
let date1,date2='';

/* Apply zomato API and impliment loadMyTip() and loadRestaurant() functions (12/10/2018 updated by jie)*/
var zomato_url = "https://developers.zomato.com/api/v2.1/";
var zomato_key = "2ee136670cff3a1bd2e4a6d8427f1e36"; //as obtained from [Zomato API](https://developers.zomato.com/apis)

var map;
var center_lat = 38.889931
var center_lng = 77.009003;
var markers, infoWindowContent

$(document).ready(() => {
  getAirports();
  $("#login").on("click", () => {
    let data = {
      user: {
        username: $("#user").val(),
        password: $("#pass").val()
      }
    };

    $.ajax(root_url + "/sessions", {
      type: 'POST',
      data: data,
      xhrFields: {
        withCredentials: true
      },
      success: () => {
        loadHome();
      },
      error: function(jqXHR, textStatus, errorThrown) {
        if (jqXHR.status === 0) {
          $("#status").html(
            '<strong class="text-danger">Unable to reach server. Make sure you are online. If you are off-campus, make sure you are connected to the VPN.</strong>'
            );
        } else if (jqXHR.status === 401) {
          $("#status").html(
            '<strong class="text-danger">Incorrect username and/or password.</strong>'
            );
        } else {
          $("#status").html(
            '<strong class="text-danger">An unknown error occurred.</strong>'
            );
        }
      }
    });
  });

  $(".city-block p").on("click", () => {
    loadCity($(event.target).html());
  });

  $(".nav-home").on("click", () => {
    loadHome();
  });

  $(".nav-myTrips").on("click", () => {
    loadMyTrip();
  });

  $("#flight").on("click", () => {
    loadFlight();
  });

	$('#create').on('click',(e)=>{
    let target=$(e.target);
    if(trip_type=='round trip'){
      let flight1=$($('#selected1').parents('.flight')[0]);
      let flight2=$($('#selected2').parents('.flight')[0]);
      let trip= new RoundTrip(flight1.attr('airport1'),flight1.attr('airport2'),date1,date2,flight1.attr('number'),flight2.attr('number'),$(flight1.children('.date1')[0]).html(),$(flight1.children('.date2')[0]).html(),$(flight2.children('.date1')[0]).html(),$(flight2.children('.date2')[0]).html());

    }else{
      let flight=$($('#selected1').parents('.flight')[0]);
      let trip= new SingleTrip(flight.attr('airport1'),flight.attr('airport2'),date1,flight.attr('number'),$(flight.children('.date1')[0]).html(),$(flight.children('.date2')[0]).html());
      
    }
    
	console.log(trip);

  });
  
  
  $('input[type=radio][name=flight]').change(function() {
    $('#flight2').hide();
    $('#flight1').show();
    $('#prev').hide();

    if (this.value == 'round-trip') {
      $('#flight').html('Flight: Departure');
      $('#return-date').show();
      trip_type='round trip';
      $('#create').hide();

      if($('#selected')){
        $('#next-return').show();
      }

    }
    else if (this.value == 'one-way') {
      $('#flight').html('Flight');
      $('#return-date').hide();
      trip_type='one way';
      $('#flight1').show();
      $('#flight2').hide();
      $('#next-return').hide();
      if($('#selected')){
        $('#create').show();
      }
    }
  });

  $("#search").on("click", () => {
    $('#buttom-b').children().each(function() {
      $( this ).hide();
    });
    findFlight(1);
  });

  $('#next-return').on("click",()=>{
    $('#next-return').hide();
    $('#prev').show();
    //make sure do not load again
    if($('#flight2').children().length==0){
      findFlight(2);
    }else{
      $('#flight1').hide();
      $('#flight2').show();
      if($('#selected')){
        $('#create').show();
      }
    }

    $('#flight').html('Flight: Arrival');
    
  });

  $('#prev').on('click',()=>{
    $('#prev').hide();
    $('#create').hide();
    $('#flight1').show();
    $('#flight2').hide();
    $('#next-return').show();
  });


  $('body').on('click','button',(e)=>{
    let target=$(e.target);

    if(target.html()=='Select'){
      if($('#flight1').css('display')=='block'){
        select1=target;

        if (trip_type=='round trip') {
          $('#next-return').show();
        }else{
          $('#create').show();
        }
        $('#selected1').html('Select');
        $('#selected1').removeAttr('id');
        target.html('Selected');
        target.attr('id', 'selected1');
      }else{
        select2=target;
        $('#create').show();
        $('#selected2').html('Select');
        $('#selected2').removeAttr('id');
        target.html('Selected');
        target.attr('id', 'selected2');
      }
    }
  });

});

function loadHome() {
  $("#home-page").show();
  $("#city-page").hide();
  $(".login").hide();
  $(".cities").show();
  $("#nav").show();
  
  //upon clicking, build a new interface: myTrip
  $(".nav-myTrips").on("click", () => {
    loadMyTrip();
  });
}

/* loadMyTrip(): when clicked on MyTrip buttom (12/10/2018 updated by jie)
	-- (1) show saved flights 
	-- (2) show saved restaurants  */
function loadCity(cityName) {
  $("#home-page").hide();
  $("#city-page").show();
  $("#city-header-title").text(cityName);
  if (cityName == "San Francisco") {
    city='San Francisco';
    $(".city").css("background-image", "url(pic/sfo.jpg)");
  } else if (cityName == "New York") {
    city='New York';
    $(".city").css("background-image", "url(pic/nyc.jpg)");
  } else if (cityName == "Chicago") {
    city='Chicago';
    $(".city").css("background-image", "url(pic/chi.jpeg)");
  } else if (cityName == "Los Angeles") {
    city='Los Angeles';
    $(".city").css("background-image", "url(pic/la.jpg)");
  }
  
   $("#rest").on("click", () => {
	   loadRestaurant(cityName);
	});
}

/* loadRestaurant(): when clicked on restaurant buttom (12/10/2018 updated by jie)
	-- (1) restaurantList(): list restaurants 
	-- (2) setMapRestMarkers(): show restaurant markers on the map and 'save to MyTrip' */
function loadRestaurant(cityName) {
  $("#rest").css("background-color", "#c8255b");
  $("#flight").css("background-color", "#86193d");
  $('#flight-result').hide();
  $('#rest-result').show();
  $('#buttom-b').hide();
  
  //try getting entity_id and entity_type from the city
	$.ajax(zomato_url + 'locations?query=' + cityName,
	{
		type: "GET", //send it through get method
        dataType: 'json',
		xhrFields: {withCredentials: false},
		headers: {"user-key": zomato_key},
		success: function(response) {
			// console.log(response.location_suggestions[0].entity_id);
			// console.log(response.location_suggestions[0].entity_type);			
			center_lat = response.location_suggestions[0].latitude;
			center_lng = response.location_suggestions[0].longitude;
			console.log(center_lat);
			console.log(center_lng);
			
			setMapCenterMarker(cityName);
	
			restaurantDetails(response.location_suggestions[0].entity_id, 
				response.location_suggestions[0].entity_type);
							
		},
		error: (jqxhr, status, error) => {
		    alert(error);
		}
		
	}); 
}

/* restaurantDetails(): list restaurants  (12/10/2018 updated by jie)*/
function restaurantDetails(entity_id, entity_type){
  
	let rlist = $('#rest-result');
	
	rlist.append("<button id='rest-nearby'>nearby</button>"
				+ "<button id='rest-best'>best-rated</button>"
				+ "<button id='rest-search'>search</button>"
				+ "<input id='rest-search-val' placeholder='type keyword...(cuisines, etc.)'>"
				+ "<div class = 'container rest-panel' hidden = 'true'></div>"
				); 
	let rpanel = $('.rest-panel');
	
	var rnearby_array, rbest_obj, rsearch;
		
	$.ajax(zomato_url + "location_details?entity_id=" + entity_id + "&entity_type=" + entity_type,
		{
			type: "GET",
			dataType: 'json',
			xhrFields: {withCredentials: false},
			headers: {"user-key": zomato_key},
			success: function(response) {
				
				rnearby_array = response.nearby_res;
				rbest_objs = response.best_rated_restaurant;
				
			},
			error: (jqxhr, status, error) => {
				alert(error);
			}
			
	}); 
	
	//list 5 nearby restaurants 
	$("#rest-nearby").on('click', () => {
		rpanel.empty();
		rpanel.show();   
		
		markers = [];
		infoWindowContent = [];
		
		for (let i=0; i<Math.min(5, rnearby_array.length); i++){
			
			$.ajax(zomato_url + "restaurant?res_id=" + rnearby_array[i],
			{	
				type: "GET", //send it through get method
				dataType: 'json',
				xhrFields: {withCredentials: false},
				headers: {"user-key": zomato_key},
				success: function(response) {
					//show map; infor = name, cuise, price, url, rate; + = add to mytrip;
					
					rpanel.append(
						"<div class='rest-header' id='rid_"+i+"'>"
						+ "NAME: "+response.name+"***CUISINES: "+ response.cuisines 
						+ "***PRICE RANGE: "+response.price_range+response.currency
						+"<br>RATING: "+response.user_rating.rating_text
						+ " ("+response.user_rating.votes+" votes)</div>"
					);		

					markers.push([response.name, response.location.latitude, response.location.longitude]);
					
					infoWindowContent.push(
						['<div class="info_content">' 
						+ '<h3>'+response.name+'</h3>' 
						+ '<p>CUISINES: '+ response.cuisines 
						+ "<br>PRICE RANGE: "+response.price_range+response.currency
						+ "<br>RATING: "+response.user_rating.aggregate_rating + " - "+ response.user_rating.rating_text
						+ " ("+response.user_rating.votes+' votes)</p>' 
						+ '</div>'
						]);
					  
				},
				error: (jqxhr, status, error) => {
					alert(error);
				}
			});

		}
		
		// console.log(markers);
		// console.log(infoWindowContent);
		setTimeout(setMapRestMarkers, 2000);
		
	})
	
	//list 5 best-rated restaurants
	$("#rest-best").on('click', () => {
		rpanel.empty();
		rpanel.show();   
		
		markers = [];
		infoWindowContent = [];
		
		for (let i=0; i<Math.min(5, rnearby_array.length); i++){
			
			$.ajax(zomato_url + "restaurant?res_id=" + rbest_objs[i].restaurant.R.res_id,
			{	
				type: "GET", //send it through get method
				dataType: 'json',
				xhrFields: {withCredentials: false},
				headers: {"user-key": zomato_key},
				success: function(response) {
					//show map; infor = name, cuise, price, rate; + = add to mytrip;
					
					rpanel.append(
						"<div class='rest-header' id='rid_"+i+"'>"
						+ "NAME: "+response.name+"***CUISINES: "+ response.cuisines 
						+ "***PRICE RANGE: "+response.price_range+response.currency
						+"<br>RATING: "+response.user_rating.rating_text
						+ " ("+response.user_rating.votes+" votes)</div>"
					);		

					markers.push([response.name, response.location.latitude, response.location.longitude]);
					
					infoWindowContent.push(
						['<div class="info_content">' 
						+ '<h3>'+response.name+'</h3>' 
						+ '<p>CUISINES: '+ response.cuisines 
						+ "<br>PRICE RANGE: "+response.price_range+response.currency
						+ "<br>RATING: "+response.user_rating.aggregate_rating + " - "+ response.user_rating.rating_text
						+ " ("+response.user_rating.votes+' votes)</p>' 
						+ '</div>'
						]);
					  
				},
				error: (jqxhr, status, error) => {
					alert(error);
				}
			});

		}
		
		// console.log(markers);
		// console.log(infoWindowContent);
		setTimeout(setMapRestMarkers, 2000);
		
	})

	//list 5 choices for given cuisines
	$("#rest-search").on('click', () => {
		rpanel.empty();
		rpanel.show();   
		
		markers = [];
		infoWindowContent = [];
			
		let q=$('#rest-search-val').val();
		$.ajax(zomato_url + "search?entity_id="+entity_id+"&entity_type="+entity_type+"&q="+q,
		{	
			type: "GET", //send it through get method
			dataType: 'json',
			xhrFields: {withCredentials: false},
			headers: {"user-key": zomato_key},
			success: function(response) {
				//show map; infor = name, cuise, price, rate; + = add to mytrip;
				let temp = response;
				for (let i=0; i< Math.min(5, temp.restaurants.length); i++){
					
					response = temp.restaurants[i].restaurant;
				
					rpanel.append(
						"<div class='rest-header' id='rid_"+i+"'>"
						+ "NAME: "+response.name+"***CUISINES: "+ response.cuisines 
						+ "***PRICE RANGE: "+response.price_range+response.currency
						+"<br>RATING: "+response.user_rating.rating_text
						+ " ("+response.user_rating.votes+" votes)</div>"
					);		

					markers.push([response.name, response.location.latitude, response.location.longitude]);
					
					infoWindowContent.push(
						['<div class="info_content">' 
						+ '<h3>'+response.name+'</h3>' 
						+ '<p>CUISINES: '+ response.cuisines 
						+ "<br>PRICE RANGE: "+response.price_range+response.currency
						+ "<br>RATING: "+response.user_rating.aggregate_rating + " - "+ response.user_rating.rating_text
						+ " ("+response.user_rating.votes+' votes)</p>' 
						+ '</div>'
					]);
				}
				  
			},
			error: (jqxhr, status, error) => {
				alert(error);
			}
		});

		
		
		// console.log(markers);
		// console.log(infoWindowContent);
		setTimeout(setMapRestMarkers, 2000);
		
	})
	
}

/* attach markers on map for restaurants (12/11/2018) */
function setMapCenterMarker(cityName){
	
	var myLatlng = new google.maps.LatLng(center_lat,center_lng);
	var mapOptions = {
		zoom: 4,
		center: myLatlng
	}
	map = new google.maps.Map(document.getElementById("map"), mapOptions);

	var marker = new google.maps.Marker({
		position: myLatlng,
		title: cityName
	});

	// To add the marker to the map, call setMap();
	marker.setMap(map);
	marker.addListener('click', ()=>{
		if (marker.getAnimation() !== null) {
			marker.setAnimation(null);
		} else {
			marker.setAnimation(google.maps.Animation.BOUNCE);
		}
	});
	
}

function setMapRestMarkers(){
	
    var bounds = new google.maps.LatLngBounds();
	var myLatlng = new google.maps.LatLng(center_lat,center_lng);
    var mapOptions = {
		zoom: 10,
		center: myLatlng
    };
    
    // Display a map on the page
    map = new google.maps.Map(document.getElementById("map"), mapOptions);
    map.setTilt(45);
     
    // Display multiple markers on a map
    var infoWindow = new google.maps.InfoWindow();
	var marker;
    
	// console.log(markers);
	// console.log(markers.length);
	// console.log(infoWindowContent);
    // Loop through our array of markers & place each one on the map  
    for(let i = 0; i < markers.length; i++) {
		
		setTimeout(function() {
			
			// console.log(markers[i][1]+" "+markers[i][2]+" "+markers[i][0]);
			var position = new google.maps.LatLng(markers[i][1], markers[i][2]);
			bounds.extend(position);
			marker = new google.maps.Marker({
				position: position,
				map: map,
				animation: google.maps.Animation.DROP,
				title: markers[i][0]
			});		
			
			marker.setMap(map);
			
			// Allow each marker to have an info window    
			google.maps.event.addListener(marker, 'click', (function(marker, i) {
				return function() {
					infoWindow.setContent(infoWindowContent[i][0]);
					infoWindow.open(map, marker);
					
					if (marker.getAnimation() !== null) {
						marker.setAnimation(null);
					} else {
						marker.setAnimation(google.maps.Animation.BOUNCE);
					}
				}
			})(marker, i));
			
			// Automatically center the map fitting all markers on the screen
			map.fitBounds(bounds);
		}, i * 2000);				
    }
    
}


function initMap() {
  // The map, centered at map_center   
  map = new google.maps.Map(
      document.getElementById('map'), 
		{	zoom: 4, 
			center: {lat: center_lat, lng: center_lng}
		});	
  
}

function loadFlight() {
  $("#rest").css("background-color", "#86193d");
  $("#flight").css("background-color", "#c8255b");
  $('#flight-result').show();
  $('#rest-result').hide();
  $('#buttom-b').show();
}

function findFlight(number) {
  loadFlight();

  let date,airport,flight,logoURL,airlineName,flightDiv ='';
  let arrivalId,departId = [];
  let flights=[];
  let flight_result_div='';
  airport=$('#depart_val').val();

  if(airport==''){
    alert('Please add airports');
    return;
  }

  if(number==1){
    flight_result_div=$('#flight1');
    $('#flight2').hide();
    flight_result_div.show();

    date1=$('#date-1').val();
    date=date1;
    //arrivalId=findAirportId(airport);
    findAirportId(airport, function(output){
      arrivalId=output;
    });

    findAirportId(city, function(output){
      departId=output;
    });
  }else{
    $('#prev').show();
    $('#flight1').hide();
    flight_result_div=$('#flight2');
    flight_result_div.show();

    date2=$('#date-2').val();
    date=date2;

    findAirportId(airport, function(output){
      departId=output;
    });

    findAirportId(city, function(output){
      arrivalId=output;
    });
  }

  flight_result_div.html('');
  $('#loading').show();

  // Find instances on that day
  $.ajax(root_url + "/instances?filter[date]="+date+"&filter[is_cancelled]=false", {
    type: 'GET',
    xhrFields: {
      withCredentials: true
    },
    success: (response) => {
      flight_result_div.html('');

      if(response!=null && response!='' && departId!=null && arrivalId!=null){
        //alert("here3 "+response.length+" "+departId.length+" "+arrivalId.length);

        console.log(departId[0].id +" "+ arrivalId[0].id);

        for(let i=0; i<response.length; i++){

          getFlight(response[i].flight_id, function(output){
            flight=output;
            for(let j=0;j<departId.length;j++){
              for(let k=0;k<arrivalId.length;k++){
                if(flight.departure_id==departId[j].id && flight.arrival_id==arrivalId[k].id){
                  console.log(flight);
                  flightDiv=$('<div class="flight" id=f'+response[i].flight_id+' airport1='+departId[j].code+' airport2='+arrivalId[k].code+' number='+flight.number+'></div>');
                  getAirlineInfo(flight.airline_id,flightDiv,function(output){
                    $('#loading').hide();
                    flightDiv=output;
                    flightDiv.append('<span class="date1">' +' '+flight.departs_at.substr(11,5)+'</span><span class="date2">'+' '+flight.arrives_at.substr(11,5)+'</span>');
                    flightDiv.append('<button class="select">Select</button>');
                    flight_result_div.append(output);
                  });
                  flights.push(flight);
                }
              }
            }    
          });
        }
      }else{
        $("#result").html("Uh oh, no instances found. Try departing from different city or choose a different date.");
      }
    },
    error: function(jqXHR, textStatus, errorThrown) {
      $("#result").html("Uh oh, no instances found. Try departing from different city or choose a different date.");
    }
  });

}


function getFlight(id,handleData){

  let url=root_url + "/flights/"+id;

  //console.log(url);

  $.ajax(url, {
    type: 'GET',
    xhrFields: {
      withCredentials: true
    },
    success: (response) => {
      if(response!=null && response!=''){
        handleData(response);
      }else{
        console.log("no suitable flight");
      }
    },
    error: function(jqXHR, textStatus, errorThrown) {
      console.log("no suitable flight");
    }
  });

}

function getAirports(flight_id,departId,arrivalId){
  $.ajax(root_url + "/airports?filter[depart_id]="+departId+"&filter[depart_id]", {
    type: 'GET',
    xhrFields: {
      withCredentials: true
    },
    success: (response) => {
      if(response!=null || response!=''){
        for(let i=0; i<response.length; i++){
          airport_names.push(response.name);
          airport_codes.push(response.code);
        }

      }else{
        alert("Can't get airport ID!");
      }

    },
    error: function(jqXHR, textStatus, errorThrown) {
      alert("Can't get airport ID!");
    }
  });
}

function findAirportId  (nameOrCode, handleData){
  let airportId=[];
  $.ajax(root_url + "/airports?filter[city]="+nameOrCode, {
    type: 'GET',
    xhrFields: {
      withCredentials: true
    },
    success: (response) => {
      //console.log(response);

      if(response!=null || response!=''){

        handleData(response);
      }else{
        alert("Can't get airort ID!");
      }
    },
    error: function(jqXHR, textStatus, errorThrown) {
      alert("Can't get airort ID!");
    }
  });

	/* $.ajax(root_url + "/airports?filter[code]="+nameOrCode, {
    type: 'GET',
    xhrFields: {
      withCredentials: true
    },
    success: (response) => {
      if(response!=null || response!=''){
        airportId=response[0].id;
      }
    },
    error: function(jqXHR, textStatus, errorThrown) {
      alert("Can't get airort ID!");
    }
  }); */
}

function getAirlineInfo(id,flightDiv,handleData){
  $.ajax(root_url + "/airlines/"+id, {
    type: 'GET',
    xhrFields: {
      withCredentials: true
    },
    success: (response) => {
      console.log(response);
      if(response!=''){
        response.name;
        flightDiv.append($('<span class="airlineName">'+response.name+'   </span>'));
        handleData(flightDiv);
      }else{
        flightDiv.html('No Airline Info Found');
        handleData(flightDiv);
      }
    },
    error: function(jqXHR, textStatus, errorThrown) {
      console.log('Find Airline Error');
    }

  });

}

//when round trip
let RoundTrip = function(airport1, airport2, date1, date2, number1, number2, time11,time12,time21,time22){
  this.airport1=airport1;
  this.airport2=airport2;
  this.date1=date1;
  this.date2=date2;
  this.number1=number1;
  this.number2=number2;
  this.time11=time11;
  this.time12=time12;
  this.time21=time21;
  this.time22=time22;
}

//when one way trip

let SingleTrip = function(airport1, airport2, date1, number1, time11,time12){
  this.airport1=airport1;
  this.airport2=airport2;
  this.date1=date1;
  this.time11=time11;
  this.time12=time12;
}

/* show flights saved in trips[] with restaurants*/
var loadMyTrip = function() {
	
	$("#home-page").hide();
	$("#city-page").hide();
	$("#trip-page").show();
	
	$(".nav-home").on('click', () => {
		loadHome();
	})
	
	listTrips();
	
	function listTrips(){
		
	}

}