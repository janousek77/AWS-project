
$(document).ready( function() {
  var newData = [];

  $("#load").click(function() {
    fetch('/load', {method: 'POST'})
    .then(function(response) {
      if(response.ok) {
        console.log('load was recorded');
        return;
      }
      throw new Error('Request failed.');
    })
    .catch(function(error) {
      console.log(error);
    });
  })

  $("#clear").click(function() {
    fetch('/clear', {method: 'POST'})
    .then(function(response) {
      if(response.ok) {
        console.log('clear was recorded');
        return;
      }
      throw new Error('Request failed.');
    })
    .catch(function(error) {
      console.log(error);
    });
  })

  $( "#form" ).on( "submit", function( event ) {
    event.preventDefault();
    $.post('/query', $('#form').serialize())
  });

  setInterval(function() {
    fetch('/test', {method: 'GET'})
      .then(function(response) {
        if(response.ok) return response.json();
        throw new Error('Request failed.');
      })
      .then(function(data) {
        document.getElementById('test').innerHTML = JSON.stringify(data.message);
;
      })
      .catch(function(error) {
        console.log(error);
      });
}, 3000);
});
