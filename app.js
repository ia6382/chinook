if (!process.env.PORT)
  process.env.PORT = 8080;

/* initialization of Chinook database */
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('chinook.sl3');
var NPerPage = 5;

/* calls callback with specified page's artists and artist's details */
var artists = function(page, artist, details, callback) {
  db.all("SELECT Artist.ArtistId, Name, StarsNo " +
    "FROM Artist, Stars WHERE Artist.ArtistId = Stars.ArtistId " +
    "ORDER BY Name LIMIT "+NPerPage+" OFFSET ($page - 1) * "+NPerPage,
    {$page: page}, function(error, rows) {
      if (error) {
        console.log(error);
         callback('<strong>Something went wrong!</strong>');
      } else {
        var result = '<div id="artists">';
        for (var i = 0; i < rows.length; i++) {
          var selected = rows[i].ArtistId == artist;
          result += '<div id="' + rows[i].ArtistId + '"><span class="numbers">' + (page * NPerPage + i - (NPerPage - 1)) + '.</span>' +
            '<a href="/artists/' + page + (!selected? '/details/' + rows[i].ArtistId: '') + '#' + rows[i].ArtistId + '">' +
            '<button type="button" class="btn btn-default' + (selected? ' selected': '') + '">' +
            rows[i].Name + '</button></a><span class="stars">';
          if (rows[i].StarsNo == 1)
            result += '<span stars="0" class="glyphicon glyphicon-star"></span>';
          else
            for (var j = 0; j < rows[i].StarsNo; j++)
              result += '<span stars="' + (j + 1) + '" class="glyphicon glyphicon-star"></span>';
          for (var j = rows[i].StarsNo; j < 3; j++)
            result += '<span stars="' + (j + 1) + '" class="glyphicon glyphicon-star-empty tiny"></span>';
          result += '</span></div>';
          if (rows[i].ArtistId == artist)
            result += '<div id="details" class="tiny">' + details + '</div>';
        }
        callback(result + '</div>');
      }
  });
}

/* calls callback with specified artist's albums */
var albums = function(artist, callback) {
  db.all("SELECT * FROM Album " +
    "WHERE ArtistId = $artist ORDER BY Title",
    {$artist: artist}, function(error, rows) {
      if (error) {
        console.log(error);
        callback('<strong>Something went wrong!</strong>');
      } else {
        var result = '<h5>Albums</h5><div id="albums">';
        if (rows.length == 0)
          result += 'No albums found for this artist';
        else
          rows.forEach(function (row) {
            result += '<div album="' + row.AlbumId + '"><em>"' + row.Title + '"</em> ' +
              '<span><span class="glyphicon glyphicon-info-sign"></span></span></div>';
          });
        callback(result + '</div>');
      }
  });
}

/* calls callback with specified artist's playlists */
var playlists = function(artist, callback) {
  db.all("SELECT DISTINCT Playlist.PlaylistId, Playlist.Name FROM Playlist, PlaylistTrack, Track, Album " +
    "WHERE Playlist.PlaylistId = PlaylistTrack.PlaylistId AND PlaylistTrack.TrackId = Track.TrackId " +
    "AND Track.AlbumId = Album.AlbumId AND ArtistId = $artist ORDER BY Playlist.PlaylistId",
    {$artist: artist}, function(error, rows) {
      if (error) {
        console.log(error);
        callback('<strong>Something went wrong!</strong>');
      } else {
        var result = '<h5>On Playlists</h5><div id="playlists">';
        if (rows.length == 0)
          result += 'This artist is on no playlists';
        else
          rows.forEach(function (row) {
            result += '<div playlist="' + row.PlaylistId + '"> <em>"' + row.Name + '"</em> ' +
              '<span><span class="glyphicon glyphicon-info-sign"></span></span></div>';
          });
        callback(result + '</div>');
      }
  });
}

/* calls callback with specified artist's genres */
var genres = function(artist, callback) {
  db.all("SELECT DISTINCT Genre.Name FROM Genre, Track, Album " +
    "WHERE Genre.GenreId = Track.GenreId AND Track.AlbumId = Album.AlbumId " +
    "AND ArtistId = $artist ORDER BY Genre.Name",
    {$artist: artist}, function(error, rows) {
      if (error) {
        console.log(error);
        callback('<strong>Something went wrong!</strong>');
      } else {
        var result = '<h5>Genres</h5><div id="genres">';
        if(rows.length == 0){
            result += "no genres found";
        }
        else{
          rows.forEach(function (row) {
              result += "|"+row.Name+"|";
          });
        }
        callback(result + '</div>');
      }
  });
}

/* initialization of Express application */
var express = require('express');
var app = express();

app.listen(process.env.PORT, function () {
  console.log('Example app listening on port: '+ process.env.PORT);
});

/* settings for static application files */
app.use(express.static('public'));
app.set('view engine', 'ejs'); //predloge

/* responds with first page's artists */
app.get('/artists', function(request, response) {
  response.redirect('/artists/1');
});

//odgovori z artist1 na korenski imenik
app.get('/', function (request, response) {
  response.redirect('/artists/1');
});

/* responds with specified page's artists */
app.get('/artists/:page', function(request, response) {
  artists(request.params.page, -1, '', function(result) {
    response.render('index', {content: result});
  });
});

/* responds with specified page's artists and artist's details */
app.get('/artists/:page/details/:artist', function(request, response) {
  albums(request.params.artist, function(albums) {
    playlists(request.params.artist, function(playlists) {
      genres(request.params.artist, function(genres) {
        artists(request.params.page, request.params.artist, albums + playlists + genres, function(result) {
          response.render('index', {content: result});
        });
      });
    });
  });
});

/* responds with specified artist's albums */
app.get('/albums/:artist', function(request, response) {
  albums(request.params.artist, function(result) {
    response.send(result);
  });
});

/* responds with specified album's details */
app.get('/album/:album', function(request, response) {
  db.get("SELECT COUNT(*) AS Tracks, SUM(Milliseconds) AS Time, " +
    "SUM(UnitPrice) AS Price FROM Track WHERE AlbumId = $album",
    {$album: request.params.album}, function(error, row) {
      if (error) {
        console.log(error);
        response.sendStatus(404);
      } else
        response.send({tracks: row.Tracks, time: row.Time, price: row.Price});
  });
});

/* responds with specified playlist's details */
app.get('/playlist/:playlist', function(request, response) {
  db.get("SELECT COUNT(*) AS Tracks, COUNT(DISTINCT ArtistId) AS Artists, " +
    "SUM(Milliseconds) AS Time, SUM(UnitPrice) AS Price FROM Track, PlaylistTrack, Album " +
    "WHERE Track.AlbumId = Album.AlbumId AND Track.TrackId = PlaylistTrack.TrackId AND PlaylistId = $playlist",
    {$playlist: request.params.playlist}, function(error, row) {
      if (error) {
        console.log(error);
        response.sendStatus(404);
      } else
        response.send({tracks: row.Tracks, artists: row.Artists, time: row.Time, price: row.Price});
  });
});

/* updates and responds with specified artist's stars */
app.get('/stars/:artist/:stars', function(request, response) {
  db.get("UPDATE Stars SET StarsNo = $stars WHERE ArtistId = $artist",
    {$artist: request.params.artist, $stars: request.params.stars}, function(error, row) {
      if (error) {
        console.log(error);
        response.sendStatus(404);
      } else
        response.send({artist: request.params.artist, stars: request.params.stars});
  });
});


/* responds with number of artist pages */
app.get('/pages', function(request, response) {
  db.get("SELECT COUNT(*) AS Artists FROM Artist", function(error, row) {
    if (error) {
      console.log(error);
      response.sendStatus(500);
    } else
      response.send({pages: Math.ceil(row.Artists / NPerPage)}); //zokrozitev
  });
});


