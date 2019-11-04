const Discord = require('discord.js')
const Canvas = require('canvas')
const client = new Discord.Client()
const lol_api = 'RGAPI-bf1d79c7-0772-4505-8652-9860d0f60505'//process.env.RAZZLE_LOL_API
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var l = require('lyric-get')

const urlsummonerid = "https://br1.api.riotgames.com/lol/summoner/v4/summoners/by-name/";
const urlgetleague = "https://br1.api.riotgames.com/lol/league/v4/entries/by-summoner/"

client.on('ready', () => {
	console.log("Connected as " + client.user.tag)

	console.log("Servers:")
	client.guilds.forEach((guild) => {
		console.log(" - " + guild.name)

		// List all channels
		guild.channels.forEach((channel) => {
			console.log(` -- ${channel.name} (${channel.type}) - ${channel.id}`)
		})
	})

})

client.on('message', recievedMessage => {
	//Previne o bot de se auto-responder
	if (recievedMessage.author == client.user) {
		return
	}

	if (recievedMessage.content.startsWith("!")) {
		processCommand(recievedMessage)
	}

})

client.on("guildMemberAdd", member => {
	const generalChannel = client.channels.get("510979547781660694")

	generalChannel.send("Olá " + member.user.toString() + ". Bem vindo ao servidor!")

})

async function processCommand(recievedMessage) {

	let fullCommand = recievedMessage.content.substr(1)
	let splitCommand = fullCommand.split(" ")
	let primaryCommand = splitCommand[0]
	let arguments = splitCommand.slice(1)
	arguments = arguments.join(" ")
	arguments = arguments.split("|")


	console.log("Commands recieved: " + primaryCommand)
	console.log("Arguments: " + arguments[0])

	if (primaryCommand === "song") {
		if (recievedMessage.author.presence.game != null) {
			if (recievedMessage.author.presence.game.toString() === "Spotify") {
				let q_track = recievedMessage.author.presence.game.details.toString();
				let q_artist = recievedMessage.author.presence.game.state.toString()

				recievedMessage.channel.send(new Discord.RichEmbed()
					.setTitle("Sua Música")
					.setColor('275BF0')
					.addField("Título:", q_track)
					.addField("Artista: ", q_artist))

			}
		}
	}

	if (primaryCommand === "lyrics") {

		if (arguments[0] != null && arguments[0].length > 0 && arguments[1] != null && arguments[1].length > 0) {

			let q_track = arguments[0];
			let q_artist = arguments[1];
			l.get(q_artist, q_track, function (err, res) {
				if (err) {
					console.log(err);
					recievedMessage.channel.send("Letras não encontradas.")
				}
				else {

					recievedMessage.channel.send(res)

				}
			});

			console.log(recievedMessage.author.presence.game);

		} else if (recievedMessage.author.presence.game != null) {

			if (recievedMessage.author.presence.game.toString() === "Spotify") {
				let q_track = recievedMessage.author.presence.game.details.toString();
				let q_artist = recievedMessage.author.presence.game.state.toString()

				l.get(q_artist, q_track, function (err, res) {
					if (err) {
						console.log("DEU MERDA " + err);
						recievedMessage.channel.send("Letras não encontradas.")
					}
					else {
						recievedMessage.channel.send(res)
					}
				});

				console.log(recievedMessage.author.presence.game);
			}
		}


	}

	if (primaryCommand === "lol") {

		const rankType = ['RANKED_SOLO_5x5', 'RANKED_TFT', 'RANKED_FLEX_SR'];

		arguments[0] = arguments[0].split(' ').join('_')

		const http = new XMLHttpRequest()
		const url = urlsummonerid.concat(arguments[0], "?api_key=", lol_api)
		http.open("GET", url);
		http.send();

		// Canvas
		const canvas = Canvas.createCanvas(744,412)
		// const canvas = Canvas.createCanvas(1000,412) // 4 ranks
		const ctx = canvas.getContext('2d')
		
		http.onreadystatechange = async (e) => {
			if (http.readyState == 4 && http.status == 200) {

				let summoner = JSON.parse(http.responseText)

				const xhr = new XMLHttpRequest()
				const url2 = urlgetleague.concat(summoner.id, "?api_key=", lol_api)
				xhr.open("GET", url2, false);
				xhr.send(null);

				let summonerRank = JSON.parse(xhr.responseText)
				// console.log(summonerRank)

				var filteredRank = [];
				rankType.forEach(rank => {
					filteredRank.push(
						Object.assign({
							'queueType': rank,
							'tier': 'UNRANKED',
							},
							summonerRank.filter((obj) => {
								return obj.queueType == rank
							})[0]
						)
					);
				});

				// const profileURL = "http://br.op.gg/summoner/userName=".concat(arguments[0])

				const background = await Canvas.loadImage('./images/background.jpg');
				ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

				// Rectangle - opacity 70%
				ctx.globalAlpha = 0.7;
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				ctx.globalAlpha = 1.0;

				// Name
				ctx.font = '28px sans-serif';
				ctx.fillStyle = '#f0e6d2';
				ctx.fillText(summoner.name, 20, 38);

				// Level
				ctx.font = '16px sans-serif';
				ctx.fillStyle = '#8c897d';
				ctx.fillText("Nível: " + summoner.summonerLevel, 20, 60);

				// Ranks
				var imageRank;
				var x = 60, y = 100;

				ctx.textBaseline="middle";
				ctx.textAlign="center";

				// // Middle lines
				// var grd = ctx.createLinearGradient(0, y + 85, canvas.width, y + 85);
				// grd.addColorStop(0,"#000000");
				// grd.addColorStop(0.5,"#60491f");
				// grd.addColorStop(1,"#000000");
				// ctx.fillStyle = grd;
				// ctx.fillRect(0, y + 85, canvas.width, 3);
				// ctx.fillRect(x, y + 105, canvas.width - x, 2);

				for (let i = 0; i < filteredRank.length; i++) {

					const element = filteredRank[i];
					
					// Elo
					imageRank = await Canvas.loadImage(getElo(element.tier));
					ctx.drawImage(imageRank, x, y, 170, 170);
					
					ctx.font = '22px Verdana';
					ctx.fillStyle = '#8c897d';
					ctx.fillText(getRankName(element.queueType), x + 85, y + 195);

					if (element.tier != 'UNRANKED') {

						ctx.font = '18px sans-serif';
						ctx.fillStyle = '#f0e6d2';
						ctx.fillText(`${element.tier} ${element.rank}`, x + 85, y + 220);

						grd = ctx.createLinearGradient(x, y + 235, x + 150, y + 235);
						grd.addColorStop(0,"#000000");
						grd.addColorStop(0.5,"#60491f");
						grd.addColorStop(1,"#000000");
						ctx.fillStyle = grd;
						ctx.fillRect(x, y + 235, 150, 3);
						

						ctx.font = '16px Verdana';
						ctx.fillStyle = '#8c897d';
						ctx.fillText(`${element.wins} VITÓRIA(S) ${element.leaguePoints} PDL`, x + 85, y + 250);
					}
					else {

						ctx.font = '18px sans-serif';
						ctx.fillStyle = '#8c897d';
						ctx.fillText('Não Ranqueado', x + 85, y + 220);

					}
					
					x += 240;
				}
				
				ctx.font = '14px sans-serif';
				ctx.fillStyle = '#f0e6d2';
				ctx.fillText('@LeBot', canvas.width - 50, 30);

				// Use helpful Attachment class structure to process the file for you
				const attachment = new Discord.Attachment(canvas.toBuffer(), 'lol-elo.png');

				recievedMessage.channel.send(attachment);

			} else if(http.readyState == 4 && http.status == 404){
				recievedMessage.channel.send("O usuário não existe.")
			}

		}

	}

}

function getElo(elo) {
	return `./images/${elo}.png`;
}

function getRankName(type) {
	if (type == "RANKED_SOLO_5x5") {
		return "SOLO/DUO"
	} else if (type === "RANKED_FLEX_SR") {
		return "FLEX 5V5"
	} else if (type === "RANKED_TFT") {
		return "TFT"
	} else if(type === "RANKED_FLEX_TT") {
		return "FLEX 3V3"
	}
}

// Get your bot's secret token from:
// https://discordapp.com/developers/applications/
// Click on your application -> Bot -> Token -> "Click to Reveal Token"
bot_secret_token = 'NTEwOTgwMDY4ODM1ODUyMjg4.Xb4-ew.N10Ly0sn6PW590JUFhWgsBD4I2I'//process.env.RAZZLE_BOT_TOKEN

client.login(bot_secret_token)