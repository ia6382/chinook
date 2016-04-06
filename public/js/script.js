$(document).ready(function() {
  /* find selected artist page */
  var page = 1;
  var url = $(location).attr('href').split('/artists')[1];
  if (url.length > 0) {
    url = url.split('/')[1];
    if (url.length > 0)
      page = parseInt(url);
  }
  
  /* requests and sets artist pages */
  $.get('/pages', function(data) {
    for (var i = 0; i < data.pages; i++)
      $('#pages').append(' <a href="/artists/' + (i + 1) + '"><button type="button" ' +
        'class="btn btn-default' + (i + 1 == page? ' selected': '') + '">' + (i + 1) + '</button></a> ');
  });
  
  /* requests update of artist's stars on click */
  $('span[stars]').click(function() {
    $.get('/stars/' + $(this).parent().parent().attr('id') + '/' + $(this).attr('stars'), function(data) {
      location.reload();
    });
  });

  /* requests and sets album's details on click */
  $('#albums div span').click(function() {
    var details = $(this);
    $.get('/album/' + details.parent().attr('album'), function(data) {
      details.html(' (' + data.tracks + ' track' + (data.tracks != 1? 's': '') + ' | ' +
        Math.round(data.time / 60000) + ' min | <strong>$' + Math.round(data.price) + '</strong> total)');
    });
  });
  
  //request details on selected playlist
  $('#playlists div span').click(function() {
    var details = $(this);
    $.get('/playlist/' + details.parent().attr('playlist'), function(data) {
      details.html(' (' + data.tracks + ' track' + (data.tracks != 1? 's': '') + ' | ' +
        Math.round(data.time / 60000) + ' min | <strong>$' + Math.round(data.price) + '</strong> total)');
    });
    
  })
  
});
