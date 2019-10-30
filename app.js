const Discord = require('discord.js')
const client = new Discord.Client()
const lol_api = process.env.RAZZLE_LOL_API
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


function processCommand(recievedMessage) {

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

		arguments[0] = arguments[0].split(' ').join('_')
		console.log("Argumentos LOL:" + arguments[0])


		const http = new XMLHttpRequest()
		const url = urlsummonerid.concat(arguments[0], "?api_key=", lol_api)
		http.open("GET", url);
		http.send();
		console.log(url)
		http.onreadystatechange = (e) => {
			if (http.readyState == 4 && http.status == 200) {

				// console.log(http.responseText)
				let summoner = JSON.parse(http.responseText)
				console.log(summoner)

				const xhr = new XMLHttpRequest()
				const url2 = urlgetleague.concat(summoner.id, "?api_key=", lol_api)
				xhr.open("GET", url2, false);
				xhr.send(null);
				console.log(xhr.responseText)
				let summonerRank = JSON.parse(xhr.responseText)
				console.log(summonerRank)

				const profileURL = "http://br.op.gg/summoner/userName=".concat(summoner.name)

				let cont = Object.keys(summonerRank).length
				console.log(cont)

				if (cont === 3) {

					recievedMessage.channel.send(new Discord.RichEmbed()
						.setThumbnail(getElo(summonerRank[0].tier))
						.setTitle(summoner.name)
						.setColor('275BF0')
						.addField("Nível de Invocador:", summoner.summonerLevel)
						.addBlankField()
						.addField(checkRankType(summonerRank[0].queueType), ".....................................")
						.addField("Elo:", summonerRank[0].tier + " " + summonerRank[0].rank)
						.addField("PDL:", summonerRank[0].leaguePoints)
						.addField("Vitórias:", summonerRank[0].wins)
						.addField("Derrotas:", summonerRank[0].losses)
						.addField("Taxa de vitória:", ((summonerRank[0].wins / (summonerRank[0].wins + summonerRank[0].losses)) * 100).toFixed(2) + "%")
						.addBlankField()
						.addField(checkRankType(summonerRank[1].queueType), ".....................................")
						.addField("Elo:", summonerRank[1].tier + " " + summonerRank[1].rank)
						.addField("PDL:", summonerRank[1].leaguePoints)
						.addField("Vitórias:", summonerRank[1].wins)
						.addField("Derrotas:", summonerRank[1].losses)
						.addField("Taxa de vitória:", ((summonerRank[1].wins / (summonerRank[1].wins + summonerRank[1].losses)) * 100).toFixed(2) + "%")
						.addBlankField()
						.addField(checkRankType(summonerRank[2].queueType), ".....................................")
						.addField("Elo:", summonerRank[2].tier + " " + summonerRank[2].rank)
						.addField("PDL:", summonerRank[2].leaguePoints)
						.addField("Vitórias:", summonerRank[2].wins)
						.addField("Derrotas:", summonerRank[2].losses)
						.addField("Taxa de vitória:", ((summonerRank[2].wins / (summonerRank[2].wins + summonerRank[2].losses)) * 100).toFixed(2) + "%")
						.addBlankField()
						.addField("Perfil OP.GG:", profileURL)
					)
				}
				else if (cont === 2) {
					recievedMessage.channel.send(new Discord.RichEmbed()
						.setThumbnail(getElo(summonerRank[0].tier))
						.setTitle(summoner.name)
						.setColor('275BF0')
						.addField("Nível de Invocador:", summoner.summonerLevel)
						.addBlankField()
						.addField(checkRankType(summonerRank[0].queueType), ".....................................")
						.addField("Elo:", summonerRank[0].tier + " " + summonerRank[0].rank)
						.addField("PDL:", summonerRank[0].leaguePoints)
						.addField("Vitórias:", summonerRank[0].wins)
						.addField("Derrotas:", summonerRank[0].losses)
						.addField("Taxa de vitória:", ((summonerRank[0].wins / (summonerRank[0].wins + summonerRank[0].losses)) * 100).toFixed(2) + "%")
						.addBlankField()
						.addField(checkRankType(summonerRank[1].queueType), ".....................................")
						.addField("Elo:", summonerRank[1].tier + " " + summonerRank[1].rank)
						.addField("PDL:", summonerRank[1].leaguePoints)
						.addField("Vitórias:", summonerRank[1].wins)
						.addField("Derrotas:", summonerRank[1].losses)
						.addField("Taxa de vitória:", ((summonerRank[1].wins / (summonerRank[1].wins + summonerRank[1].losses)) * 100).toFixed(2) + "%")
						.addBlankField()
						.addField("Perfil OP.GG:", profileURL)
					)
				} else if (cont === 1) {
					recievedMessage.channel.send(new Discord.RichEmbed()
						.setThumbnail(getElo(summonerRank[0].tier))
						.setTitle(summoner.name)
						.setColor('275BF0')
						.addField("Nível de Invocador:", summoner.summonerLevel)
						.addField(checkRankType(summonerRank[0].queueType), ".....................................")
						.addField("Elo:", summonerRank[0].tier + " " + summonerRank[0].rank)
						.addField("PDL:", summonerRank[0].leaguePoints)
						.addField("Vitórias:", summonerRank[0].wins)
						.addField("Derrotas:", summonerRank[0].losses)
						.addField("Taxa de vitória:", ((summonerRank[0].wins / (summonerRank[0].wins + summonerRank[0].losses)) * 100).toFixed(2) + "%")
						.addBlankField()
						.addField("Perfil OP.GG:", profileURL)
					)
				} else {
					recievedMessage.channel.send(new Discord.RichEmbed()
						.setTitle(summoner.name)
						.setColor('275BF0')
						.addField("Nível de Invocador:", summoner.summonerLevel)
						.addField("**__SOLO/DUO stats:__**", "Not ranked")
						.addBlankField()
						.addField("**__FLEX stats:__**", "Not ranked")
						.addBlankField()
						.addField("**__TFT stats:__**", "Not ranked")
						.addBlankField()
						.addField("Perfil OP.GG:", profileURL)
					)
				}
			} else if(http.readyState == 4 && http.status == 404){
				recievedMessage.channel.send("O usuário não existe.")
				console.log("FAIL")
			}
		}



	}

}


function getElo(elo) {
	if (elo === "IRON") return "https://i.imgur.com/YXgY8m5.png"
	if (elo === "BRONZE") return "https://i.imgur.com/HH7jeVu.png"
	if (elo === "SILVER") return "https://i.imgur.com/bqiAZQ1.png"
	if (elo === "GOLD") return "https://i.imgur.com/jpuxCC6.png"
	if (elo === "PLATINUM") return "https://i.imgur.com/u1RGUs9.png"
	if (elo === "DIAMOND") return "https://i.imgur.com/t9TLrGl.png"
	if (elo === "MASTER") return "https://i.imgur.com/YBWbIND.png"
	if (elo === "GRANDMASTER") return "https://i.imgur.com/1dkHMxD.png"
	if (elo === "CHALLENGER") return "https://i.imgur.com/c7j9Duw.png"
}

function checkRankType(type) {

	if (type == "RANKED_SOLO_5x5") {
		return " **__SOLO/DUO stats:__**"
	} else if (type === "RANKED_FLEX_SR") {
		return " **__FLEX stats:__**"
	} else if (type === "RANKED_TFT") {
		return "**__TFT stats:__**"
	}
}



// Get your bot's secret token from:
// https://discordapp.com/developers/applications/
// Click on your application -> Bot -> Token -> "Click to Reveal Token"
bot_secret_token = process.env.RAZZLE_BOT_TOKEN

client.login(bot_secret_token)
