let root_url = "http://comp426.cs.unc.edu:3001/";
let city='';
let trip_type="round trip";
let airport_names=[];
let airport_codes=[];
let select1,select2=''; //selected to and return flights
let trips = [];
let date1,date2='';

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

  $("#rest").on("click", () => {
    loadRestaurant();
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

    loadMyTrip();
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
}

function loadMyTrip() {
  $("#home-page").hide();
  $("#city-page").hide();
  $("#trip-page").show();
}

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
  loadRestaurant();

}

function loadRestaurant() {
  $("#rest").css("background-color", "#c8255b");
  $("#flight").css("background-color", "#86193d");
  $('#flight-result').hide();
  $('#rest-result').show();
  $('#buttom-b').hide();
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

  // $.ajax(root_url + "/airports?filter[code]="+nameOrCode, {
  //   type: 'GET',
  //   xhrFields: {
  //     withCredentials: true
  //   },
  //   success: (response) => {
  //     if(response!=null || response!=''){
  //       airportId=response[0].id;
  //     }
  //   },
  //   error: function(jqXHR, textStatus, errorThrown) {
  //     alert("Can't get airort ID!");
  //   }
  // });
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


function loadMyTrip(){


};

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

