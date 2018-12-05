let root_url = "http://comp426.cs.unc.edu:3001/";

let city='';
let trip_type="round trip";

$(document).ready(() => {
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

  $('input[type=radio][name=flight]').change(function() {
    if (this.value == 'round-trip') {
      $('#flight').html('Flight: Departure');
      $('#return-date').show();
    }
    else if (this.value == 'one-way') {
      $('#flight').html('Flight');
      $('#return-date').hide();
    }
  });

  $("#search").on("click", () => {
    showFlight();
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
  $("#result").html("");
}

function loadFlight() {
  $("#rest").css("background-color", "#86193d");
  $("#flight").css("background-color", "#c8255b");
  $("#result").html("");
}

function showFlight() {
  loadFlight();

  $.ajax(root_url + "/airlines", {
    type: 'GET',
    xhrFields: {
      withCredentials: true
    },
    success: () => {
      alert('success');
    },
    error: function(jqXHR, textStatus, errorThrown) {
      $("#result").html("Uh oh, no flights found. Try departing from different city or choose a different date.");
    }
  });

}