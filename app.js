require("dotenv").config();
const bignumber = require("bignumber.js");
const Discord = require("discord.js");
const Canvas = require("canvas");
const client = new Discord.Client();
const lol_api = process.env.RAZZLE_LOL_API;
const steam_api = process.env.RAZZLE_STEAM_API;
const MOVIE_API = process.env.RAZZLE_MOVIE_API;
const RAPIDAPI_KEY = process.env.RAZZLE_RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAZZLE_RAPIDAPI_HOST;
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var l = require("lyric-get");
const axios = require("axios");

const urlsummonerid =
  "https://br1.api.riotgames.com/lol/summoner/v4/summoners/by-name/";
const urlgetleague =
  "https://br1.api.riotgames.com/lol/league/v4/entries/by-summoner/";
const urlstratzdota = "https://api.stratz.com/api/v1/";
const url64steamid = `http://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${steam_api}&vanityurl=`;
const urlMoviesDB = "https://api.themoviedb.org/3";
const urlImdb =
  "https://imdb-internet-movie-database-unofficial.p.rapidapi.com/film/";

client.on("ready", () => {
  console.log("Connected as " + client.user.tag);

  console.log("Servers:");
  client.guilds.forEach((guild) => {
    console.log(" - " + guild.name);

    // List all channels
    guild.channels.forEach((channel) => {
      console.log(` -- ${channel.name} (${channel.type}) - ${channel.id}`);
    });
  });
});

client.on("message", (receivedMessage) => {
  //Previne o bot de se auto-responder
  if (receivedMessage.author == client.user) {
    return;
  }

  if (receivedMessage.content.startsWith("!")) {
    processCommand(receivedMessage);
  }
});

client.on("guildMemberAdd", (member) => {
  const generalChannel = client.channels.get("510979547781660694");

  generalChannel.send(
    "Olá " + member.user.toString() + ". Bem vindo ao servidor!"
  );
});

function processCommand(receivedMessage) {
  let fullCommand = receivedMessage.content.substr(1);
  let splitCommand = fullCommand.split(" ");
  let primaryCommand = splitCommand[0];
  let arguments = splitCommand.slice(1);
  arguments = arguments.join(" ");
  arguments = arguments.split("|");

  console.log("Commands recieved: " + primaryCommand);
  console.log("Arguments: " + arguments[0]);

  if (primaryCommand === "song") {
    if (receivedMessage.author.presence.game != null) {
      if (receivedMessage.author.presence.game.toString() === "Spotify") {
        let q_track = receivedMessage.author.presence.game.details.toString();
        let q_artist = receivedMessage.author.presence.game.state.toString();

        receivedMessage.channel.send(
          new Discord.RichEmbed()
            .setTitle("Sua Música")
            .setColor("275BF0")
            .addField("Título:", q_track)
            .addField("Artista: ", q_artist)
        );
      }
    }
  }

  if (primaryCommand === "random") {
    let values = arguments[0].split(",");
    let randomValue = values[Math.floor(Math.random() * values.length)];
    receivedMessage.channel.send(randomValue);
  }

  if (primaryCommand === "genres") {
    getGenres().then((genres) => {
      if (genres.length === 0) {
        receivedMessage.channel.send(
          "Desculpe, tive dificuldaes internas aqui... Manda o Adm dar uma olhadinha em mim dps"
        );
        return;
      }
      const embed = new Discord.RichEmbed()
        .setTitle("Available Genres")
        .setColor("9927f0");

      genres.forEach((genre) => {
        embed.addField(genre.name, "\u200B", true);
      });

      receivedMessage.channel.send(embed);
    });
  }

  if (primaryCommand === "movie") {
    const genre = arguments[0];
    createMovieEmbed(genre, receivedMessage);
  }

  if (primaryCommand === "lyrics") {
    if (
      arguments[0] != null &&
      arguments[0].length > 0 &&
      arguments[1] != null &&
      arguments[1].length > 0
    ) {
      let q_track = arguments[0];
      let q_artist = arguments[1];
      l.get(q_artist, q_track, function (err, res) {
        if (err) {
          console.log(err);
          receivedMessage.channel.send("Letras não encontradas.");
        } else {
          receivedMessage.channel.send(res);
        }
      });

      console.log(receivedMessage.author.presence.game);
    } else if (receivedMessage.author.presence.game != null) {
      if (receivedMessage.author.presence.game.toString() === "Spotify") {
        let q_track = receivedMessage.author.presence.game.details.toString();
        let q_artist = receivedMessage.author.presence.game.state.toString();

        l.get(q_artist, q_track, function (err, res) {
          if (err) {
            console.log("DEU MERDA " + err);
            receivedMessage.channel.send("Letras não encontradas.");
          } else {
            receivedMessage.channel.send(res);
          }
        });

        console.log(receivedMessage.author.presence.game);
      }
    }
  }

  if (primaryCommand === "lol") {
    const rankType = ["RANKED_SOLO_5x5", "RANKED_TFT", "RANKED_FLEX_SR"];

    arguments[0] = arguments[0].split(" ").join("_");

    const http = new XMLHttpRequest();
    const url = urlsummonerid.concat(arguments[0], "?api_key=", lol_api);
    http.open("GET", url);
    http.send();

    // Canvas
    const canvas = Canvas.createCanvas(744, 412);
    // const canvas = Canvas.createCanvas(1000,412) // show 4 ranks
    const ctx = canvas.getContext("2d");

    http.onreadystatechange = async (e) => {
      if (http.readyState == 4 && http.status == 200) {
        const summoner = JSON.parse(http.responseText);

        const xhr = new XMLHttpRequest();
        const url2 = urlgetleague.concat(summoner.id, "?api_key=", lol_api);
        xhr.open("GET", url2, false);
        xhr.send(null);

        const summonerRank = JSON.parse(xhr.responseText);
        // console.log(summonerRank)

        const filteredRank = [];
        rankType.forEach((rank) => {
          filteredRank.push({
            queueType: rank,
            tier: "UNRANKED",
            ...summonerRank.find((obj) => obj.queueType == rank)
          });
        });

        const background = await Canvas.loadImage(
          "./images/lol/background.jpg"
        );
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

        // Rectangle - opacity 70%
        ctx.globalAlpha = 0.7;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1.0;

        // Name
        ctx.font = "28px sans-serif";
        ctx.fillStyle = "#f0e6d2";
        ctx.fillText(summoner.name, 20, 38);

        // Level
        ctx.font = "16px sans-serif";
        ctx.fillStyle = "#8c897d";
        ctx.fillText("Nível: " + summoner.summonerLevel, 20, 60);

        // Ranks
        let x = 60,
          y = 100;

        ctx.textBaseline = "middle";
        ctx.textAlign = "center";

        for (let i = 0; i < filteredRank.length; x += 240, i++) {
          const element = filteredRank[i];

          // Elo
          const imageRank = await Canvas.loadImage(getElo(element.tier));
          ctx.drawImage(imageRank, x, y, 170, 170);

          ctx.font = "22px Verdana";
          ctx.fillStyle = "#8c897d";
          ctx.fillText(getRankName(element.queueType), x + 85, y + 195);

          if (element.tier == "UNRANKED") {
            ctx.font = "18px sans-serif";
            ctx.fillStyle = "#8c897d";
            ctx.fillText("Não Ranqueado", x + 85, y + 220);
          } else {
            ctx.font = "18px sans-serif";
            ctx.fillStyle = "#f0e6d2";
            ctx.fillText(`${element.tier} ${element.rank}`, x + 85, y + 220);

            grd = ctx.createLinearGradient(x, y + 235, x + 150, y + 235);
            grd.addColorStop(0, "#000000");
            grd.addColorStop(0.5, "#60491f");
            grd.addColorStop(1, "#000000");
            ctx.fillStyle = grd;
            ctx.fillRect(x, y + 235, 150, 3);

            ctx.font = "16px Verdana";
            ctx.fillStyle = "#8c897d";
            ctx.fillText(
              `${element.wins} VITÓRIA(S) ${element.leaguePoints} PDL`,
              x + 85,
              y + 250
            );
          }
        }

        ctx.font = "14px sans-serif";
        ctx.fillStyle = "#f0e6d2";
        ctx.fillText("@LeBot", canvas.width - 50, 30);

        const attachment = new Discord.Attachment(
          canvas.toBuffer(),
          "lol-elo.png"
        );

        receivedMessage.channel.send(attachment);
      } else if (http.readyState == 4 && http.status == 404) {
        receivedMessage.channel.send("O usuário não existe.");
      }
    };
  }

  if (primaryCommand === "dota") {
    const canvas = Canvas.createCanvas(300, 300);
    // const canvas = Canvas.createCanvas(1000,412) // show 4 ranks
    const ctx = canvas.getContext("2d");

    const http = new XMLHttpRequest();
    let steam64idurl = url64steamid + arguments[0];
    http.open("GET", steam64idurl);
    http.send();

    http.onreadystatechange = async (e) => {
      if (http.readyState == 4 && http.status == 200) {
        let response = JSON.parse(http.responseText);

        let bit32 = bignumber(response.response.steamid).minus(
          "76561197960265728"
        );

        console.log(bit32.c[0]);

        const xhr = new XMLHttpRequest();
        let playerurl = urlstratzdota + `/Player/${bit32.c[0]}`;
        xhr.open("GET", playerurl, false);
        xhr.send(null);

        let player = JSON.parse(xhr.responseText);
        console.log(player);

        var x = 60,
          y = 60;

        ctx.textBaseline = "middle";
        ctx.textAlign = "center";

        imageRank = await Canvas.loadImage(
          `./images/dota/${player.steamAccount.seasonRank}.png`
        );
        ctx.drawImage(imageRank, x, y, 170, 170);

        // Use helpful Attachment class structure to process the file for you
        const attachment = new Discord.Attachment(
          canvas.toBuffer(),
          "lol-elo.png"
        );

        receivedMessage.channel.send(attachment);

        // const attachment = new Discord.Attachment(`./images/dota/${player.steamAccount.seasonRank}.png`, 'medal.png');
        // receivedMessage.channel.send(new Discord.RichEmbed()
        // .setTitle(player.steamAccount.name)
        // .setColor('275BF0')
        // .attachFile()
        // .addField("Rank:", player.steamAccount.seasonRank))
      } else if (http.readyState == 4 && http.status == 404) {
        receivedMessage.channel.send("O usuário não existe.");
      }
    };
  }
}

async function createMovieEmbed(genre, receivedMessage) {
  console.log('creatingEmbed');
  getGenres().then((genres) => {
    const exists = genres.find(
      (g) => g.name.toLowerCase() === genre.toLowerCase()
    );
    if (!exists) {
      receivedMessage.channel.send(
        "Eita.. Bota um gênero certo ai namoralzinha"
      );
      return;
    }

    discoverMovie(exists.id).then((movie) => {
      getImdbData(movie.title).then((imdbData) => {
        if (!imdbData) {
          createMovieEmbed(genre, receivedMessage);
          return;
        }
        const embed = new Discord.RichEmbed()
          .setColor("9927f0")
          .setTitle(movie.title)
          .setThumbnail(imdbData.poster)
          .addField("Description", imdbData.plot || movie.overview)
          .addField(
            "Release Date",
            imdbData.year || `${movie.release_date.split("-")[0]}*`,
            true
          )
          .addField("Length", imdbData.length || "Unavailable", true)
          .addField("Rating", imdbData.rating || `${movie.vote_average}*`, true)
          .addField("IMDB Link", `https://www.imdb.com/title/${imdbData.id}`);

        receivedMessage.channel.send(embed).then((message) => {
          message.react("⏭️");
          const filter = (reaction, user) => {
            return reaction.emoji.name === "⏭️";
          };
          let collector = message.createReactionCollector(filter, {
            max: 2,
            time: 60000,
            errors: ["time"]
          });
          collector.on("collect", (reaction, collector) => {
            console.log("got a reaction");
          });
          collector.on("end", (collected) => {
            const reaction = collected.get("⏭️");
            if (reaction && reaction.count > 1) {
              createMovieEmbed(genre, receivedMessage);
            }
          });
        });
      });
    });
  });
}

async function getImdbData(movieTitle) {
  var options = {
    method: "GET",
    url: `${urlImdb}${movieTitle}`,
    headers: {
      "x-rapidapi-key": RAPIDAPI_KEY,
      "x-rapidapi-host": RAPIDAPI_HOST
    }
  };

  const result = axios
    .request(options)
    .then(function (response) {
      return response.data;
    })
    .catch(function (error) {
      console.error(error);
      return null;
    });

  return result;
}

async function discoverMovie(genreId) {
  const discoverUrl = urlMoviesDB + `/discover/movie`;
  const watchProviders = "8|119";
  const region = "BR";
  let totalPages = 1;
  try {
    let res = await axios.get(discoverUrl, {
      params: {
        api_key: MOVIE_API,
        with_watch_providers: watchProviders,
        watch_region: region,
        with_genres: genreId
      }
    });
    const randomPage = Math.floor(Math.random() * res.data.total_pages) + 1;

    res = await axios.get(discoverUrl, {
      params: {
        api_key: MOVIE_API,
        with_watch_providers: watchProviders,
        watch_region: region,
        with_genres: genreId,
        page: randomPage
      }
    });

    const movies = res.data.results;
    const randomMovie = movies[Math.floor(Math.random() * movies.length)];
    return randomMovie;
  } catch (err) {
    console.log(err);
    return null;
  }
}

async function getGenres() {
  const genresUrl = urlMoviesDB + `/genre/movie/list`;
  const result = axios
    .get(genresUrl, {
      params: {
        api_key: MOVIE_API
      }
    })
    .then((res) => {
      return res.data.genres;
    })
    .catch((err) => {
      // Handle Error Here
      console.log("deu err", err);
      return [];
    });
  return result;
}

function getElo(elo) {
  return `./images/lol/${elo}.png`;
}

function getRankName(type) {
  if (type == "RANKED_SOLO_5x5") {
    return "SOLO/DUO";
  } else if (type === "RANKED_FLEX_SR") {
    return "FLEX 5V5";
  } else if (type === "RANKED_TFT") {
    return "TFT";
  } else if (type === "RANKED_FLEX_TT") {
    return "FLEX 3V3";
  }
}

// Get your bot's secret token from:
// https://discordapp.com/developers/applications/
// Click on your application -> Bot -> Token -> "Click to Reveal Token"
bot_secret_token = process.env.RAZZLE_BOT_TOKEN;

client.login(bot_secret_token);
