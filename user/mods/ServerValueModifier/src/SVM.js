"use strict";

class MainSVM
{
	preAkiLoad(container)
	{

		const Logger = container.resolve("WinstonLogger");
		try { //Checking for loader.json, if doesn't exist - throw a message, disable the mod.
		const Config = require('../Loader/loader.json');
		}
		catch (e)
		{	
				const Logger = container.resolve("WinstonLogger");
				Logger.error("\nSVM: SVM is lacking loader file or there is an error, mod is disabled");
				Logger.warning("Most likely you're running this mod for the first time, head to the SVM mod folder and run the GFVE.exe")
				Logger.warning("Don't forget to apply your changes...Really, hit that Apply button, it will create loader file\n")
				Logger.warning("SVM: If it's Syntax error, edit it manually in loader.json or/and edit values with GFVE properly");
				Logger.warning("Exception message below may help you distinguish what went wrong:\n");
				Logger.error(e.message+"\n");
				return
		}
		const Config = require('../Loader/loader.json');
		const StaticRouterModService = container.resolve("StaticRouterModService");
		const HttpResponse = container.resolve("HttpResponseUtil");
		//PRE LOAD - RAIDS SECTION
		if (Config.Hideout.EnableHideout)
		{
			if(Config.Hideout.Regeneration.OfflineRegen)
			{
		container.afterResolution("GameController", (_t, result) => 
			{
				result.updateProfileHealthValues = (url, info, sessionID) => 
				{
				}
			},{frequency: "Always"});
			}
		}
		if (Config.Raids.SafeExit)
		{
		container.afterResolution("InraidCallbacks", (_t, result) => 
			{
				result.saveProgress = (url, info, sessionID) => 
				{
				if(info.exit == "left" && !info.isPlayerScav)
					{
						info.exit = "runner"
					}
					const InraidController = container.resolve("InraidController");
					InraidController.savePostRaidProgress(info, sessionID);
				return HttpResponse.nullResponse();
				}
			},{frequency: "Always"});
		}

		if (Config.Raids.SaveGearAfterDeath)
		{
		container.afterResolution("InraidCallbacks", (_t, result) => 
			{
				result.saveProgress = (url, info, sessionID) => 
				{
				if(info.exit !== "survived" && !info.isPlayerScav)
					{
						info.exit = "runner"
					}
					const InraidController = container.resolve("InraidController");
					InraidController.savePostRaidProgress(info, sessionID);
				return HttpResponse.nullResponse();
				}
			},{frequency: "Always"});
		}
				//PRE LOAD - DEPRECATED SECTION
		if (Config.Deprecated.SkillMax)
		{
			Logger.debug("SVM: Max Skills activated")
			StaticRouterModService.registerStaticRouter("MaxSkills", [
			{
				url: "/client/game/version/validate",
				action: (url, info, sessionID) =>
				{
					try
					{
						let pmcData = container.resolve("ProfileHelper").getPmcProfile(sessionID);
						for (let skills in pmcData.Skills.Common)
						{
							let skill = pmcData.Skills.Common[skills] //I think it could be done to reverse it, but just setting skill.Progress = 0 may still make them appear in skills tree
							switch (skill.Id)
							{
								case "BotReload":
									if (Config.Deprecated.BotReload)
									{
										skill.Progress = 5100;
									}
									break;
								case "BotSound":
									if (Config.Deprecated.BotSound)
									{
										skill.Progress = 5100;
									}
									break;
								default:
									skill.Progress = 5100;
									break;
							}
						}
						return HttpResponse.nullResponse();
					}
					catch (e)
					{
						Logger.error("Max Skills: Error spotted or New profile detected, Cancelling function" + e)
						return HttpResponse.nullResponse();
					}
				}
			}], "aki");
		}
		if ((Config.Deprecated.EnableDeprecated || Config.Raids.EnableRaids)) //Connected all 3 functions into one, 2 events and AI debug tool. Double IFs are cringe, but i didn't came up with a better solution.
		//First is basically a band-aid to avoid exceptions if fields don't exist, and the second is applying the value.
		{
			StaticRouterModService.registerStaticRouter("AIGENERATION",
				[
				{
					url: "/client/game/bot/generate",
					action: (url, info, sessionID) =>
					{
							const BotController = container.resolve("BotController");
							if(Config.Raids.RaidEvents !== undefined)
							{
								if(Config.Raids.RaidEvents.RaidersEverywhere)
								{
									for (let type in info.conditions)
									{
										let roles = info.conditions[type]
										roles.Role = "pmcBot"
									}
								}
								if(Config.Raids.RaidEvents.CultistsEverywhere)
								{
									for (let type in info.conditions)
									{
										let roles = info.conditions[type]
										roles.Role = "sectantWarrior"
									}
								}
							}
							if( Config.Deprecated.DebugAI !== undefined)
							{
								if(Config.Deprecated.DebugAI)
								{
									Logger.info("/client/game/bot/generate data was: " + JSON.stringify(info.conditions))
								}
							}
							return HttpResponse.getBody(BotController.generate(sessionID,info));
					}
				}], "aki");
		}
		//PRE LOAD - CSM SECTION
		if (Config.CSM.DefaultPocket)
		{
			StaticRouterModService.registerStaticRouter("DefaultPockets",
				[
				{
					url: "/client/game/version/validate",
					action: (url, info, sessionID) =>
					{
						let Pocketscheck = 0;
						let pmcData = container.resolve("ProfileHelper").getPmcProfile(sessionID);
						try
						{
							pmcData.Inventory.items.forEach((item) =>
							{
								if (item.slotId == "Pockets")
								{
									Pocketscheck++;
									item._tpl = "627a4e6b255f7527fb05a0f6";
								}
							})
							if(Pocketscheck == 0)
							{
								pmcData.Inventory.items.push(
									{"_id": "SVMRevivedPockets",
									"_tpl": "627a4e6b255f7527fb05a0f6",
									"parentId": pmcData.Inventory.equipment,
									"slotId": "Pockets"}
								)
							}
							return HttpResponse.nullResponse();
						}
						catch (e)
						{
							Logger.error("Default Pockets: New profile detected, Cancelling function" + e)
							return HttpResponse.nullResponse();
						}
					}
				}], "aki");
		}
		if (Config.CSM.CustomPocket)
		{		
				StaticRouterModService.registerStaticRouter("CustomPocket",
					[
					{
						url: "/client/game/version/validate",
						action: (url, info, sessionID) =>
						{
							let Pocketscheck = 0;
							let pmcData = container.resolve("ProfileHelper").getPmcProfile(sessionID);
							try
							{
								pmcData.Inventory.items.forEach((item) =>
								{
									if (item.slotId == "Pockets")
									{
										Pocketscheck++;
										item._tpl = "CustomPocket";
									}
								})
								if(Pocketscheck == 0)
								{
									pmcData.Inventory.items.push(
										{"_id": "SVMRevivedPockets",
										"_tpl": "627a4e6b255f7527fb05a0f6",
										"parentId": pmcData.Inventory.equipment,
										"slotId": "Pockets"}
									)
								}
								return HttpResponse.nullResponse();
							}
							catch (e)
							{
								Logger.error("Bigger Pockets: New profile detected, Cancelling function" + e)
								return HttpResponse.nullResponse();
							}
						}
					}], "aki");
		}
		//HEALTH FUNCTIONS
		if (Config.Player.EnableHealth || Config.Scav.EnableScavHealth || Config.Scav.ScavCustomPockets || Config.Player.EnableEnergyHydrationTab) //TO OVERRIDE HEALTH + CURRENT SCAV HEALTH AND POCKETS BEFORE RAID
		{
			StaticRouterModService.registerStaticRouter("EditHealth",
				[
				{
					url: "/client/game/version/validate",
					action: (url, info, sessionID) =>
					{
						try
						{
							let pmcData = container.resolve("ProfileHelper").getPmcProfile(sessionID);
							let scavData = container.resolve("ProfileHelper").getScavProfile(sessionID);
							if(Config.Player.EnableEnergyHydrationTab)
							{
								pmcData.Health.Energy.Maximum = Config.Player.EnergyHydrationTab.MaxEnergy;
								pmcData.Health.Hydration.Maximum = Config.Player.EnergyHydrationTab.MaxHydration;
							}
							if (Config.Player.EnableHealth)
							{
							pmcData.Health.BodyParts["Head"].Health.Maximum = Config.Player.Health.Head
							pmcData.Health.BodyParts["Chest"].Health.Maximum = Config.Player.Health.Chest
							pmcData.Health.BodyParts["Stomach"].Health.Maximum = Config.Player.Health.Stomach
							pmcData.Health.BodyParts["LeftArm"].Health.Maximum = Config.Player.Health.LeftArm
							pmcData.Health.BodyParts["LeftLeg"].Health.Maximum = Config.Player.Health.LeftLeg
							pmcData.Health.BodyParts["RightArm"].Health.Maximum = Config.Player.Health.RightArm
							pmcData.Health.BodyParts["RightLeg"].Health.Maximum = Config.Player.Health.RightLeg
							}
							if (Config.Scav.EnableScavHealth)
							{
							scavData.Health.BodyParts["Head"].Health.Maximum = Config.Scav.ScavHealth.ScavHead
							scavData.Health.BodyParts["Chest"].Health.Maximum = Config.Scav.ScavHealth.ScavChest
							scavData.Health.BodyParts["Stomach"].Health.Maximum = Config.Scav.ScavHealth.ScavStomach
							scavData.Health.BodyParts["LeftArm"].Health.Maximum = Config.Scav.ScavHealth.ScavLeftArm
							scavData.Health.BodyParts["LeftLeg"].Health.Maximum = Config.Scav.ScavHealth.ScavLeftLeg
							scavData.Health.BodyParts["RightArm"].Health.Maximum = Config.Scav.ScavHealth.ScavRightArm
							scavData.Health.BodyParts["RightLeg"].Health.Maximum = Config.Scav.ScavHealth.ScavRightLeg
							//Because default health will not be increased
							scavData.Health.BodyParts["Head"].Health.Current = Config.Scav.ScavHealth.ScavHead
							scavData.Health.BodyParts["Chest"].Health.Current = Config.Scav.ScavHealth.ScavChest
							scavData.Health.BodyParts["Stomach"].Health.Current = Config.Scav.ScavHealth.ScavStomach
							scavData.Health.BodyParts["LeftArm"].Health.Current = Config.Scav.ScavHealth.ScavLeftArm
							scavData.Health.BodyParts["LeftLeg"].Health.Current = Config.Scav.ScavHealth.ScavLeftLeg
							scavData.Health.BodyParts["RightArm"].Health.Current = Config.Scav.ScavHealth.ScavRightArm
							scavData.Health.BodyParts["RightLeg"].Health.Current = Config.Scav.ScavHealth.ScavRightLeg
							}
							if(Config.Scav.ScavCustomPockets)
							{
								scavData.Inventory.items.forEach((item) =>
								{
									if (item.slotId == "Pockets")
									{
										item._tpl = "ScavCustomPocket";
									}
								})
							}
							return HttpResponse.nullResponse();
						}
						catch (e)
						{
							Logger.error("SVM:Edit health - Unknown error occured" + e)
							return HttpResponse.nullResponse();
						}
					}
				}], "aki");
		}
		if (Config.Scav.EnableScavHealth || Config.Scav.ScavCustomPockets) // TO OVERRIDE NEXT SCAVS HEALTH + POCKETS
		StaticRouterModService.registerStaticRouter("EditHealthv2",
		[
		{
			url: "/raid/profile/save",
			action: (url, info, sessionID) =>
			{
				try
				{
					const saveServer = container.resolve("SaveServer");
					let scavData = container.resolve("ProfileHelper").getScavProfile(sessionID);
					if (Config.Scav.EnableScavHealth)
					{
					scavData.Health.BodyParts["Head"].Health.Maximum = Config.Scav.ScavHealth.ScavHead
					scavData.Health.BodyParts["Chest"].Health.Maximum = Config.Scav.ScavHealth.ScavChest
					scavData.Health.BodyParts["Stomach"].Health.Maximum = Config.Scav.ScavHealth.ScavStomach
					scavData.Health.BodyParts["LeftArm"].Health.Maximum = Config.Scav.ScavHealth.ScavLeftArm
					scavData.Health.BodyParts["LeftLeg"].Health.Maximum = Config.Scav.ScavHealth.ScavLeftLeg
					scavData.Health.BodyParts["RightArm"].Health.Maximum = Config.Scav.ScavHealth.ScavRightArm
					scavData.Health.BodyParts["RightLeg"].Health.Maximum = Config.Scav.ScavHealth.ScavRightLeg
					//Because default health will not be increased
					scavData.Health.BodyParts["Head"].Health.Current = Config.Scav.ScavHealth.ScavHead
					scavData.Health.BodyParts["Chest"].Health.Current = Config.Scav.ScavHealth.ScavChest
					scavData.Health.BodyParts["Stomach"].Health.Current = Config.Scav.ScavHealth.ScavStomach
					scavData.Health.BodyParts["LeftArm"].Health.Current = Config.Scav.ScavHealth.ScavLeftArm
					scavData.Health.BodyParts["LeftLeg"].Health.Current = Config.Scav.ScavHealth.ScavLeftLeg
					scavData.Health.BodyParts["RightArm"].Health.Current = Config.Scav.ScavHealth.ScavRightArm
					scavData.Health.BodyParts["RightLeg"].Health.Current = Config.Scav.ScavHealth.ScavRightLeg
					}
					if(Config.Scav.ScavCustomPockets)
					{
						scavData.Inventory.items.forEach((item) =>
						{
							if (item.slotId == "Pockets")
							{
								item._tpl = "ScavCustomPocket";
							}
						})
					}
					saveServer.getProfile(sessionID).characters.scav = scavData;
					return HttpResponse.nullResponse();
				}
				catch (e)
				{
					Logger.error("Unknown error occured" + e)
					return HttpResponse.nullResponse();
				}
			}
		}], "aki");
	}
	 postDBLoad(container)
	{
		const Logger = container.resolve("WinstonLogger");
		try {
		const Config = require('../Loader/loader.json');
		}
		catch (e)
		{
		return
		}
		//Config variables to asset for funcs.
		const Config = require('../Loader/loader.json');
		//DB redirects
		const DB = container.resolve("DatabaseServer").getTables();
		const hideout = DB.hideout;
		const locations = DB.locations;
		const traders = DB.traders;
		const Quests = DB.templates.quests;
		const suits = DB.templates.customization;
		const items = DB.templates.items;
		const globals = DB.globals.config;
		//DEBUG CONFIGS
		/*const Inraid = require('G:/Games/EFTOFF/Aki_Data/Server/configs/inraid.json');
		const Repair = require('G:/Games/EFTOFF/Aki_Data/Server/configs/repair.json');
		const locs = require('G:/Games/EFTOFF/Aki_Data/Server/configs/location.json');
		const Airdrop = require('G:/Games/EFTOFF/Aki_Data/Server/configs/airdrop.json');
		const Ragfair = require('G:/Games/EFTOFF/Aki_Data/Server/configs/ragfair.json');
		const Insurance = require('G:/Games/EFTOFF/Aki_Data/Server/configs/insurance.json');
		const Health = require('G:/Games/EFTOFF/Aki_Data/Server/configs/health.json');
		const Bots = require('G:/Games/EFTOFF/Aki_Data/Server/configs/bot.json');
		const Quest = require('G:/Games/EFTOFF/Aki_Data/Server/configs/quest.json');
		const WeatherValues = require('G:/Games/EFTOFF/Aki_Data/Server/configs/weather.json');
		const trader = require('G:/Games/EFTOFF/Aki_Data/Server/configs/trader.json');
		const PMC = require('G:/Games/EFTOFF/Aki_Data/Server/configs/pmc.json');
		*/


		// Redirects to server internal configs.

		const configServer = container.resolve("ConfigServer");
		const Inraid = configServer.getConfig("aki-inraid");
		const Repair = configServer.getConfig("aki-repair");
		const locs = configServer.getConfig("aki-location");
		const Airdrop = configServer.getConfig("aki-airdrop");
		const Ragfair = configServer.getConfig("aki-ragfair");
		const Insurance = configServer.getConfig("aki-insurance");
		const Health = configServer.getConfig("aki-health");
		const Bots = configServer.getConfig("aki-bot");
		const Quest = configServer.getConfig("aki-quest");
		const hideoutC = configServer.getConfig("aki-hideout");
		const WeatherValues = configServer.getConfig("aki-weather");
		const trader = configServer.getConfig("aki-trader");
		const Inventory = configServer.getConfig("aki-inventory");
		const BlackItems = configServer.getConfig("aki-item");
		const PMC = configServer.getConfig("aki-pmc")
		const BL = Config.BL;
		const Bot = DB.bots.types

		//First initialising loggers
		const funni = 
		[
		"So, how's Baldur's Gate 3?","Still no coop in SVM, what a shame",
		"Have you tried Minecraft though?","I hope Nikita is proud of me",
		"This release provides you 16x time the details according to Todd Howard",
		"Bears are based but cringe, Usecs are cringe but based",
		"90% of the update time were wasted for this specific line you're reading",
		"Still not enough tooltips added, slight chance to get stuck in a toaster",
		"Kept ya waiting huh?", "You're finally awake, you were trying to play like a chad, right?",
		"It's here, lurking in the shadows","Chomp goes Caw Caw","Goose goes Honk Honk","GhostFenixx goes 'Not again'","I miss KMC Weapons ;-;",
		"Hello, how's your day? :]","I hope you have enough RAM to play this","Wipe at Thursday",
		"Tagilla locked me up in the basement to write mods for Tarkov, send help",
		"If you're reading this, you're capable of reading!","Who wrote this stuff anyway?",
		"Hot single SCAVs in you area!","These lines are such a waste of space",
		"Do you like hurting other people?","Don't play Gaijin games, such a cash grab, good source of classified data tho",
		"YOU, YES YOU, YOU ARE AWESOME, NOW LIVE WITH THAT!","Did you wash your dishes?",
		"Sanitar did nothing wrong","Why am i even updating this mod? I haven't played Tarkov for ages",
		"Don't worry, I won't judge your preferences, you're my favorite casual <3",
		"Me (Head-Eyes) You",
		"Did you know? If you kill guys with guns, there will be no one to kill you!",
		"The all consuming gluttony is approaching","I swear if I forgot some logger somewhere i'll choke someone",
		"Go on, tell me you're trying to run EFT with 8GB of ram","Are you seriously playing SPT by yourself?",
		"No, Putting 16x Scope onto TOZ is not a great idea","Don't dissapoint the Glock Daddy",
		"Go on, take SVD into factory, see if I care","RFB AND VPO FOR THE WIN!","Makes your experience better since 2021!",
		"You better not forget to take splint with you this time", "You cannot Escape From Tarkov"]

		Logger.log(`SVM 1.7.1 has initialized, ` + funni[Math.floor(Math.random() * funni.length)],"blue"); //No proper math random in JS, smh


		if (Config.PresetName != "" && Config.PresetName != undefined)
		{
			Logger.log("SVM Preset - " + Config.PresetName + " - successfully loaded", "blue");
		}
		if(Config.LimitsRemoved)
		{
			Logger.warning("SVM: WARNING - VALUES OVERRIDE DETECTED, NO SUPPORT WILL BE GIVEN USING THAT OPTION")
		}
		//############## FLEAMARKET SECTION ###########
		if(Config.Fleamarket.EnableFleamarket)
			{
				Logger.debug("SVM:Fleamarket settings enabled")
				globals.RagFair.minUserLevel = Config.Fleamarket.FleaMarketLevel;
				Ragfair.dynamic.purchasesAreFoundInRaid = Config.Fleamarket.FleaFIR;
				Ragfair.dynamic.blacklist.enableBsgList = !Config.Fleamarket.DisableBSGList;
				Ragfair.dynamic.blacklist.custom = Config.Fleamarket.FleaBlacklist;
				Ragfair.dynamic.removeSeasonalItemsWhenNotInEvent = !Config.Fleamarket.EventOffers
				//BlackItems.blacklist = Config.Fleamarket.FleaBlacklist;
				Ragfair.sell.fees = Config.Fleamarket.PlayerOffers.EnableFees;
				Ragfair.sell.chance.base = Config.Fleamarket.PlayerOffers.Sell_chance;
				Ragfair.sell.chance.underpriced = Config.Fleamarket.PlayerOffers.Sell_underprice;
				Ragfair.sell.chance.overpriced = Config.Fleamarket.PlayerOffers.Sell_overprice;
				Ragfair.sell.time.base = Config.Fleamarket.PlayerOffers.Tradeoffer_avg;
				Ragfair.sell.time.max = Config.Fleamarket.PlayerOffers.Tradeoffer_max;
				Ragfair.sell.time.min = Config.Fleamarket.PlayerOffers.Tradeoffer_min;
				Ragfair.sell.reputation.gain = Config.Fleamarket.PlayerOffers.Rep_gain;
				Ragfair.sell.reputation.loss = Config.Fleamarket.PlayerOffers.Rep_loss;
				//Dynamic offers
				Ragfair.dynamic.expiredOfferThreshold = Config.Fleamarket.DynamicOffers.ExpireThreshold;
				//Min-Max
				Ragfair.dynamic.offerItemCount.min = Config.Fleamarket.DynamicOffers.PerOffer_min;
				Ragfair.dynamic.offerItemCount.max = Config.Fleamarket.DynamicOffers.PerOffer_max;

				//Unifying the multiplier, not the best case scenario, but it is rather simple to comprehend and modify for common user, they'll never know >_>
				Ragfair.dynamic.priceRanges.default.min = Config.Fleamarket.DynamicOffers.Price_min;
				Ragfair.dynamic.priceRanges.default.max = Config.Fleamarket.DynamicOffers.Price_max;
				Ragfair.dynamic.priceRanges.pack.min = Config.Fleamarket.DynamicOffers.Price_min;
				Ragfair.dynamic.priceRanges.pack.max = Config.Fleamarket.DynamicOffers.Price_max;
				Ragfair.dynamic.priceRanges.preset.min = Config.Fleamarket.DynamicOffers.Price_min;
				Ragfair.dynamic.priceRanges.preset.max = Config.Fleamarket.DynamicOffers.Price_max;


				Ragfair.dynamic.endTimeSeconds.min = Config.Fleamarket.DynamicOffers.Time_min*60;
				Ragfair.dynamic.endTimeSeconds.max = Config.Fleamarket.DynamicOffers.Time_max*60;
				
				Ragfair.dynamic.nonStackableCount.min = Config.Fleamarket.DynamicOffers.NonStack_min;
				Ragfair.dynamic.nonStackableCount.max = Config.Fleamarket.DynamicOffers.NonStack_max;
				Ragfair.dynamic.stackablePercent.min = Config.Fleamarket.DynamicOffers.Stack_min;
				Ragfair.dynamic.stackablePercent.max = Config.Fleamarket.DynamicOffers.Stack_max;
				//Currencies
				Ragfair.dynamic.currencies["5449016a4bdc2d6f028b456f"] = Config.Fleamarket.DynamicOffers.Roubleoffers;
				Ragfair.dynamic.currencies["5696686a4bdc2da3298b456a"] = Config.Fleamarket.DynamicOffers.Dollaroffers;
				Ragfair.dynamic.currencies["569668774bdc2da2298b4568"] = Config.Fleamarket.DynamicOffers.Eurooffers;
				//Trader static offers
				Ragfair.traders["54cb50c76803fa8b248b4571"] = Config.Fleamarket.TraderStaticOffers.Praporoffers;
				Ragfair.traders["54cb57776803fa99248b456e"] = Config.Fleamarket.TraderStaticOffers.Therapistoffers;
				Ragfair.traders["579dc571d53a0658a154fbec"] = Config.Fleamarket.TraderStaticOffers.Fenceoffers;
				Ragfair.traders["58330581ace78e27b8b10cee"] = Config.Fleamarket.TraderStaticOffers.SkierOffers;
				Ragfair.traders["5935c25fb3acc3127c3d8cd9"] = Config.Fleamarket.TraderStaticOffers.Peacekeeperoffers;
				Ragfair.traders["5a7c2eca46aef81a7ca2145d"] = Config.Fleamarket.TraderStaticOffers.Mechanicoffers;
				Ragfair.traders["5ac3b934156ae10c4430e83c"] = Config.Fleamarket.TraderStaticOffers.Ragmanoffers;
				Ragfair.traders["5c0647fdd443bc2504c2d371"] = Config.Fleamarket.TraderStaticOffers.Jaegeroffers;
				Ragfair.traders["ragfair"] = Config.Fleamarket.TraderStaticOffers.AllOffers;
				//Wear condition in offers
				Ragfair.dynamic.condition["5422acb9af1c889c16000029"].min = parseFloat((Config.Fleamarket.FleaConditions.FleaWeapons_Min /100).toFixed(2))
				Ragfair.dynamic.condition["543be5664bdc2dd4348b4569"].min = parseFloat((Config.Fleamarket.FleaConditions.FleaMedical_Min /100).toFixed(2))
				Ragfair.dynamic.condition["5447e0e74bdc2d3c308b4567"].min = parseFloat((Config.Fleamarket.FleaConditions.FleaSpec_Min /100).toFixed(2))
				Ragfair.dynamic.condition["543be5e94bdc2df1348b4568"].min = parseFloat((Config.Fleamarket.FleaConditions.FleaKeys_Min /100).toFixed(2))
				Ragfair.dynamic.condition["5448e5284bdc2dcb718b4567"].min = parseFloat((Config.Fleamarket.FleaConditions.FleaVests_Min /100).toFixed(2))
				Ragfair.dynamic.condition["57bef4c42459772e8d35a53b"].min = parseFloat((Config.Fleamarket.FleaConditions.FleaArmor_Min /100).toFixed(2))
				Ragfair.dynamic.condition["543be6674bdc2df1348b4569"].min = parseFloat((Config.Fleamarket.FleaConditions.FleaFood_Min /100).toFixed(2))

				Ragfair.dynamic.condition["5422acb9af1c889c16000029"].max = parseFloat((Config.Fleamarket.FleaConditions.FleaWeapons_Max /100).toFixed(2))
				Ragfair.dynamic.condition["543be5664bdc2dd4348b4569"].max = parseFloat((Config.Fleamarket.FleaConditions.FleaMedical_Max /100).toFixed(2))
				Ragfair.dynamic.condition["5447e0e74bdc2d3c308b4567"].max = parseFloat((Config.Fleamarket.FleaConditions.FleaSpec_Max /100).toFixed(2))
				Ragfair.dynamic.condition["543be5e94bdc2df1348b4568"].max = parseFloat((Config.Fleamarket.FleaConditions.FleaKeys_Max /100).toFixed(2))
				Ragfair.dynamic.condition["5448e5284bdc2dcb718b4567"].max = parseFloat((Config.Fleamarket.FleaConditions.FleaVests_Max /100).toFixed(2))
				Ragfair.dynamic.condition["57bef4c42459772e8d35a53b"].max = parseFloat((Config.Fleamarket.FleaConditions.FleaArmor_Max /100).toFixed(2))
				Ragfair.dynamic.condition["543be6674bdc2df1348b4569"].max = parseFloat((Config.Fleamarket.FleaConditions.FleaFood_Max /100).toFixed(2))

				if(Config.Fleamarket.OverrideOffers)
				{
					const offer = {
						"from": -100000,
						"to": 100000,
						"count": Config.Fleamarket.SellOffers.SellOffersAmount
					}
					globals.RagFair.maxActiveOfferCount = []
					globals.RagFair.maxActiveOfferCount.push(offer)
				}

		}
		//############## LOOT SECTION #################
		if (Config.Loot.EnableLoot)
		{
			Logger.debug("SVM:Loot settings enabled")
			//loose loot mults
			locs.looseLootMultiplier.bigmap = Config.Loot.Locations.Bigmap_mult;
			locs.looseLootMultiplier.factory4_day = Config.Loot.Locations.FactoryDay_mult;
			locs.looseLootMultiplier.factory4_night = Config.Loot.Locations.FactoryNight_mult;
			locs.looseLootMultiplier.interchange = Config.Loot.Locations.Interchange_mult;
			locs.looseLootMultiplier.laboratory = Config.Loot.Locations.Laboratory_mult;
			locs.looseLootMultiplier.rezervbase = Config.Loot.Locations.Reserve_mult;
			locs.looseLootMultiplier.shoreline = Config.Loot.Locations.Shoreline_mult;
			locs.looseLootMultiplier.woods = Config.Loot.Locations.Woods_mult;
			locs.looseLootMultiplier.lighthouse = Config.Loot.Locations.Lighthouse_mult;
			locs.looseLootMultiplier.tarkovstreets = Config.Loot.Locations.Streets_mult;
			//container loot mults
			locs.staticLootMultiplier.bigmap = Config.Loot.Locations.Bigmap_conmult;
			locs.staticLootMultiplier.factory4_day = Config.Loot.Locations.FactoryDay_conmult;
			locs.staticLootMultiplier.factory4_night = Config.Loot.Locations.FactoryNight_conmult;
			locs.staticLootMultiplier.interchange = Config.Loot.Locations.Interchange_conmult;
			locs.staticLootMultiplier.laboratory = Config.Loot.Locations.Laboratory_conmult;
			locs.staticLootMultiplier.rezervbase = Config.Loot.Locations.Reserve_conmult;
			locs.staticLootMultiplier.shoreline = Config.Loot.Locations.Shoreline_conmult;
			locs.staticLootMultiplier.woods = Config.Loot.Locations.Woods_conmult;
			locs.staticLootMultiplier.lighthouse = Config.Loot.Locations.Lighthouse_conmult;
			locs.staticLootMultiplier.tarkovstreets = Config.Loot.Locations.Streets_conmult;
			locs.containerRandomisationSettings.enabled = !Config.Loot.RandomContPlace
			//############## AIRDROPS SECTION ##################
			//Logger.info(Airdrop.loot)
			Airdrop.airdropMinStartTimeSeconds = Config.Loot.Airdrops.AirtimeMin*60;
			Airdrop.airdropMaxStartTimeSeconds = Config.Loot.Airdrops.AirtimeMax*60;

			Airdrop.airdropChancePercent.reserve = Config.Loot.Airdrops.Reserve_air;
			Airdrop.airdropChancePercent.shoreline = Config.Loot.Airdrops.Shoreline_air;
			Airdrop.airdropChancePercent.woods = Config.Loot.Airdrops.Woods_air;
			Airdrop.airdropChancePercent.lighthouse = Config.Loot.Airdrops.Lighthouse_air;
			Airdrop.airdropChancePercent.bigmap = Config.Loot.Airdrops.Bigmap_air;
			Airdrop.airdropChancePercent.interchange = Config.Loot.Airdrops.Interchange_air;
			Airdrop.airdropChancePercent.tarkovStreets = Config.Loot.Airdrops.Streets_air;

			Airdrop.loot.mixed.itemCount.min = Config.Loot.Airdrops.MixedMin
			Airdrop.loot.weaponArmor.itemCount.min = Config.Loot.Airdrops.EquipMin
			Airdrop.loot.barter.itemCount.min = Config.Loot.Airdrops.BarterMin	
			Airdrop.loot.foodMedical.itemCount.min = Config.Loot.Airdrops.MedicalMin
			Airdrop.loot.mixed.itemCount.max = Config.Loot.Airdrops.MixedMax
			Airdrop.loot.weaponArmor.itemCount.max = Config.Loot.Airdrops.EquipMax
			Airdrop.loot.barter.itemCount.max = Config.Loot.Airdrops.BarterMax
			Airdrop.loot.foodMedical.itemCount.max = Config.Loot.Airdrops.MedicalMax

			Airdrop.loot.mixed.presetCount.min = Config.Loot.Airdrops.MixedPresetsMin
			Airdrop.loot.weaponArmor.presetCount.min = Config.Loot.Airdrops.EquipPresetsMin
			Airdrop.loot.barter.presetCount.min = Config.Loot.Airdrops.BarterPresetsMin
			Airdrop.loot.foodMedical.presetCount.min = Config.Loot.Airdrops.MedicalPresetsMin
			Airdrop.loot.mixed.presetCount.max = Config.Loot.Airdrops.MixedPresetsMax
			Airdrop.loot.weaponArmor.presetCount.max = Config.Loot.Airdrops.EquipPresetsMax
			Airdrop.loot.barter.presetCount.max = Config.Loot.Airdrops.BarterPresetsMax
			Airdrop.loot.foodMedical.presetCount.max = Config.Loot.Airdrops.MedicalPresetsMin

			Airdrop.loot.mixed.weaponCrateCount.min = Config.Loot.Airdrops.MixedCratesMin
			Airdrop.loot.weaponArmor.weaponCrateCount.min = Config.Loot.Airdrops.EquipCratesMin
			Airdrop.loot.barter.weaponCrateCount.min = Config.Loot.Airdrops.BarterCratesMin
			Airdrop.loot.foodMedical.weaponCrateCount.min = Config.Loot.Airdrops.MedicalCratesMin
			Airdrop.loot.mixed.weaponCrateCount.max = Config.Loot.Airdrops.MixedCratesMax
			Airdrop.loot.weaponArmor.weaponCrateCount.max = Config.Loot.Airdrops.EquipCratesMax
			Airdrop.loot.barter.weaponCrateCount.max = Config.Loot.Airdrops.BarterCratesMax
			Airdrop.loot.foodMedical.weaponCrateCount.max = Config.Loot.Airdrops.MedicalCratesMin
		}
		//############## BOTS SECTION #################
		if (Config.Bots.EnableBots)
		{
			Logger.debug("SVM:Bot section settings enabled")
			if(Config.Bots.EnableAIChance)
			{
				for (let i in locations)
				{
					if (i !== "base" && locations[i].base.BossLocationSpawn)
					{
						for (let x in locations[i].base.BossLocationSpawn)
						{
							switch (locations[i].base.BossLocationSpawn[x].BossName)
							{
								case "bossBoar":
									locations[i].base.BossLocationSpawn[x].BossChance = Config.Bots.AIChance.KabanChance
								break;
								case "bossBully":
									locations[i].base.BossLocationSpawn[x].BossChance = Config.Bots.AIChance.ReshalaChance
								break;
								case "bossSanitar":
									locations[i].base.BossLocationSpawn[x].BossChance = Config.Bots.AIChance.SanitarChance
								break;
								case "bossKilla":
									if (i == "interchange")
									{
										locations[i].base.BossLocationSpawn[x].BossChance = Config.Bots.AIChance.KillaChance
									}
									if (i == "tarkovstreets")
									{
										locations[i].base.BossLocationSpawn[x].BossChance = Config.Bots.AIChance.KillaStreetsChance
									}
								break;
								case "bossTagilla":
									if (i == "factory4_day")
									{
										locations[i].base.BossLocationSpawn[x].BossChance = Config.Bots.AIChance.TagillaChance
									}
									if (i == "factory4_night")
									{
										locations[i].base.BossLocationSpawn[x].BossChance = Config.Bots.AIChance.TagillaNightChance
									}
								break;
								case "bossGluhar":
									if (i == "rezervbase")
									{
										locations[i].base.BossLocationSpawn[x].BossChance = Config.Bots.AIChance.GlukharChance
									}
								break;
								case "bossKojaniy":
									locations[i].base.BossLocationSpawn[x].BossChance = Config.Bots.AIChance.ShturmanChance
								break;
								case "bossZryachiy":
									locations[i].base.BossLocationSpawn[x].BossChance = Config.Bots.AIChance.ZryachiyChance
								break;
								case "exUsec":
									locations[i].base.BossLocationSpawn[x].BossChance = Config.Bots.AIChance.RogueChance
								break;
								case "bossKnight":
									if  (i == "woods")
									{
										locations[i].base.BossLocationSpawn[x].BossChance = Config.Bots.AIChance.TrioWoodsChance 
									}
									if  (i == "shoreline")
									{
										locations[i].base.BossLocationSpawn[x].BossChance = Config.Bots.AIChance.TrioShorelineChance 
									}
									if  (i == "bigmap")
									{
										locations[i].base.BossLocationSpawn[x].BossChance = Config.Bots.AIChance.TrioChance 
									}
									if  (i == "lighthouse")
									{
										locations[i].base.BossLocationSpawn[x].BossChance = Config.Bots.AIChance.TrioLighthouseChance 
									}
								break;
								case "pmcBot":
									if (i == "laboratory")
									{
										locations[i].base.BossLocationSpawn[x].BossChance = Config.Bots.AIChance.RaiderLabChance
									}
									if  (i == "rezervbase")
									{
										locations[i].base.BossLocationSpawn[x].BossChance = Config.Bots.AIChance.RaiderReserveChance
									}
								break;
								case "sectantPriest":
									if (i == "factory4_night")
									{
										locations[i].base.BossLocationSpawn[x].BossChance = Config.Bots.AIChance.CultistFactoryChance
									}
									if  (i == "woods")
									{

										locations[i].base.BossLocationSpawn[x].BossChance = Config.Bots.AIChance.CultistWoodsChance
									}
									if (i == "bigmap")
									{
										locations[i].base.BossLocationSpawn[x].BossChance = Config.Bots.AIChance.CultistCustomsChance
									}
									if  (i == "shoreline")
									{
										locations[i].base.BossLocationSpawn[x].BossChance = Config.Bots.AIChance.CultistShorelineChance
									}
								break;
							}
						}
					}
				}
			}

			locations["bigmap"].base.MaxBotPerZone = Config.Bots.BotSpawn.CustomsSPZ;
			locations["factory4_day"].base.MaxBotPerZone = Config.Bots.BotSpawn.FactoryNightSPZ;
			locations["factory4_night"].base.MaxBotPerZone = Config.Bots.BotSpawn.FactoryDaySPZ;
			locations["interchange"].base.MaxBotPerZone = Config.Bots.BotSpawn.InterchangeSPZ;
			locations["laboratory"].base.MaxBotPerZone = Config.Bots.BotSpawn.LaboratorySPZ;
			locations["shoreline"].base.MaxBotPerZone = Config.Bots.BotSpawn.ShorelineSPZ;
			locations["woods"].base.MaxBotPerZone = Config.Bots.BotSpawn.WoodsSPZ;
			locations["rezervbase"].base.MaxBotPerZone = Config.Bots.BotSpawn.ReserveSPZ;
			locations["lighthouse"].base.MaxBotPerZone = Config.Bots.BotSpawn.LighthouseSPZ;
			locations["tarkovstreets"].base.MaxBotPerZone = Config.Bots.BotSpawn.StreetsSPZ;
			Bots.maxBotCap.factory4_day = Config.Bots.BotSpawn.FactoryLimit;
			Bots.maxBotCap.factory4_night = Config.Bots.BotSpawn.FactoryLimit;
			Bots.maxBotCap.customs = Config.Bots.BotSpawn.CustomsLimit;
			Bots.maxBotCap.woods = Config.Bots.BotSpawn.WoodsLimit;
			Bots.maxBotCap.shoreline = Config.Bots.BotSpawn.ShorelineLimit;
			Bots.maxBotCap.lighthouse = Config.Bots.BotSpawn.LighthouseLimit;
			Bots.maxBotCap.reservebase = Config.Bots.BotSpawn.ReserveLimit;
			Bots.maxBotCap.interchange = Config.Bots.BotSpawn.InterchangeLimit;
			Bots.maxBotCap.laboratory = Config.Bots.BotSpawn.LaboratoryLimit;
			Bots.maxBotCap.tarkovstreets = Config.Bots.BotSpawn.StreetsLimit;

		    const BotDur = Config.Bots.BotDurability;
			const BotWepMinID = [BotDur.WeaponScavMin, BotDur.WeaponMarksmanMin, BotDur.WeaponRaiderMin, BotDur.WeaponRogueMin, BotDur.WeaponPMCMin, BotDur.WeaponBossMin, BotDur.WeaponFollowerMin];
			const BotWepMaxID = [BotDur.WeaponScavMax, BotDur.WeaponMarksmanMax, BotDur.WeaponRaiderMax, BotDur.WeaponRogueMax, BotDur.WeaponPMCMax, BotDur.WeaponBossMax, BotDur.WeaponFollowerMax];
			const BotArmorMinID = [BotDur.ArmorScavMin, BotDur.ArmorMarksmanMin, BotDur.ArmorRaiderMin, BotDur.ArmorRogueMin, BotDur.ArmorPMCMin, BotDur.ArmorBossMin, BotDur.ArmorFollowerMin];
			const BotArmorMaxID = [BotDur.ArmorScavMax, BotDur.ArmorMarksmanMax, BotDur.ArmorRaiderMax, BotDur.ArmorRogueMax, BotDur.ArmorPMCMax, BotDur.ArmorBossMax, BotDur.ArmorFollowerMax];

			const BotTypeID = ["assault","marksman","pmcbot","exusec","pmc","boss","follower"]
			for ( let durab in BotTypeID)
			{
			Bots.durability[BotTypeID[durab]].weapon.lowestMax = BotWepMinID[durab];
			Bots.durability[BotTypeID[durab]].weapon.highestMax = BotWepMaxID[durab];
			Bots.durability[BotTypeID[durab]].armor.maxDelta = 100 - BotArmorMinID[durab];
			Bots.durability[BotTypeID[durab]].armor.minDelta = 100 -BotArmorMaxID[durab];
				switch (BotTypeID[durab])
				{
					case "assault":
						Bots.durability["cursedassault"].weapon.lowestMax = BotWepMinID[durab]
						Bots.durability["cursedassault"].weapon.highestMax = BotWepMaxID[durab]
						Bots.durability["cursedassault"].armor.maxDelta = 100 - BotArmorMinID[durab];
						Bots.durability["cursedassault"].armor.minDelta = 100 - BotArmorMaxID[durab];

						Bots.durability["crazyassaultevent"].weapon.lowestMax = BotWepMinID[durab]
						Bots.durability["crazyassaultevent"].weapon.highestMax = BotWepMaxID[durab]
						Bots.durability["crazyassaultevent"].armor.maxDelta = 100 - BotArmorMinID[durab];
						Bots.durability["crazyassaultevent"].armor.minDelta = 100 - BotArmorMaxID[durab];
						break;
					case "pmcbot":
						Bots.durability["arenafighterevent"].weapon.lowestMax = BotWepMinID[durab]
						Bots.durability["arenafighterevent"].weapon.highestMax = BotWepMaxID[durab]
						Bots.durability["arenafighterevent"].armor.maxDelta = 100 - BotArmorMinID[durab];
						Bots.durability["arenafighterevent"].armor.minDelta = 100 - BotArmorMaxID[durab];
					break
					case "boss":
						Bots.durability["sectantpriest"].weapon.lowestMax = BotWepMinID[durab];
						Bots.durability["sectantpriest"].weapon.highestMax = BotWepMaxID[durab];
						Bots.durability["sectantpriest"].armor.maxDelta = 100 - BotArmorMinID[durab];
						Bots.durability["sectantpriest"].armor.minDelta = 100 - BotArmorMaxID[durab];
						break;
					case "follower":
						Bots.durability["sectantwarrior"].weapon.lowestMax = BotWepMinID[durab];
						Bots.durability["sectantwarrior"].weapon.highestMax = BotWepMaxID[durab];
						Bots.durability["sectantwarrior"].armor.maxDelta = 100 - BotArmorMinID[durab];
						Bots.durability["sectantwarrior"].armor.minDelta = 100 - BotArmorMaxID[durab];
						break;
				}
			}
		}
		//############## DEPRECATED SECTION ###########
		if(Config.Deprecated.EnableDeprecated)
		{
		//WIP Save Equipment after death - Midcore
		if(Config.Deprecated.Midcore)
		{
			const Midcore = configServer.getConfig("aki-lostondeath");
			Midcore.equipment.Headwear = false;
			Midcore.equipment.Earpiece = false;
			Midcore.equipment.FaceCover = false;
			Midcore.equipment.ArmorVest = false;
			Midcore.equipment.FirstPrimaryWeapon = false;
			Midcore.equipment.SecondPrimaryWeapon = false;
			Midcore.equipment.Holster = false;
			Midcore.equipment.Eyewear = false;
		}
			if (Config.Deprecated.RemoveStock)
			{
				for (let CurTrader in traders)
				{
					if (CurTrader !== "ragfair" && CurTrader !== "638f541a29ffd1183d187f57" && CurTrader !== "579dc571d53a0658a154fbec") //avoid ragfair, lighthouse trader and fence
					{
						for(let assortment in traders[CurTrader].assort.barter_scheme)
						{
							if( traders[CurTrader].assort.barter_scheme[assortment][0][0]._tpl == "5449016a4bdc2d6f028b456f" || 
							traders[CurTrader].assort.barter_scheme[assortment][0][0]._tpl == "569668774bdc2da2298b4568" ||
							traders[CurTrader].assort.barter_scheme[assortment][0][0]._tpl =="5696686a4bdc2da3298b456a")
							{
								for(let DeletElem in traders[CurTrader].assort.items)
								{
									if(traders[CurTrader].assort.items[DeletElem]._id == assortment )
									{
									traders[CurTrader].assort.items.splice(DeletElem,1) //splice instead of delete is important - you can't have blank space in array or it will cause exception with ragfair generation
									break;//generally ineffecient way of search, break makes it less painful since we know there's only 1 element possible.
									}
								}
								for(let DeletLoyal in traders[CurTrader].loyal_level_items)
								{
									if(traders[CurTrader].assort.loyal_level_items.DeletLoyal == assortment )
									{
									delete traders[CurTrader].assort.loyal_level_items.DeletLoyal
									break;
									}
								}
								delete traders[CurTrader].assort.barter_scheme[assortment] //delete is fine here though
							}
						}
					}
				}
			}
		//Change weapons parts moddability
		for (const id in items)
		{
			let base = items[id]

		if (Config.Deprecated.InRaidModdable && base._props.RaidModdable !== undefined)
			{
				EditSimpleItemData(id, "RaidModdable", true);
				if (base._props.ToolModdable)
					{
						EditSimpleItemData(id, "ToolModdable", true);
					}
				if (base._props.Slots)
					{
					for (let z in base._props.Slots)
						{
							if (base._props.Slots[z]._required !== "false")
								{
									base._props.Slots[z]._required = false;
								}
						}
					}
			}
			// BallisticCoeficient - WIP
		if (base._parent === "5485a8684bdc2da71d8b4567" && base._props.BallisticCoeficient !== undefined)
			{
			EditSimpleItemData(id,"BallisticCoeficient", parseFloat(base._props.BallisticCoeficient * Config.Deprecated.BallisticCoefMult).toFixed(4));
			}
			if (Config.Deprecated.EnableBarterStack)
				{
					if(base._props.StackMaxSize !== undefined)
					{
						switch (base._parent)
						{
							case "57864ee62459775490116fc1":
								// Battery
								EditSimpleItemData(id, "StackMaxSize", Config.Deprecated.StackValues.Battery)
								break;
							case "57864ada245977548638de91":
								//Building materials
								EditSimpleItemData(id, "StackMaxSize", Config.Deprecated.StackValues.Buildmats)
								break;
							case "57864a66245977548f04a81f":
								//Electronics
								EditSimpleItemData(id, "StackMaxSize", Config.Deprecated.StackValues.Electronics)
								break;
							case "57864c322459775490116fbf":
								//Household goods
								EditSimpleItemData(id, "StackMaxSize", Config.Deprecated.StackValues.Householdgoods)
								break;
							case "57864a3d24597754843f8721":
								// Valuables
								EditSimpleItemData(id, "StackMaxSize", Config.Deprecated.StackValues.Jewelry)
								break;
							case "57864c8c245977548867e7f1":
								//Medical supplies
								EditSimpleItemData(id, "StackMaxSize", Config.Deprecated.StackValues.Medsupplies)
								break;
							case "57864e4c24597754843f8723":
								//Flammable
								EditSimpleItemData(id, "StackMaxSize", Config.Deprecated.StackValues.Fuel)
								break;
							case "57864bb7245977548b3b66c2":
								//Tools
								EditSimpleItemData(id, "StackMaxSize", Config.Deprecated.StackValues.Tools)
								break;
							case "590c745b86f7743cc433c5f2":
								//Other
								if(id !== "59f32bb586f774757e1e8442" && id !== "59f32c3b86f77472a31742f0")
								{
								EditSimpleItemData(id, "StackMaxSize", Config.Deprecated.StackValues.Other)
								}
								break;
								default:
								break;
						}
					}
				}
			}
		}
		//############## INSURANCE/REPAIR SECTION ############
		if (Config.Insurance.EnableInsurance)
		{
			for (let CurTrader in traders)
			{
				if (CurTrader !== "ragfair" && (CurTrader == "5a7c2eca46aef81a7ca2145d" || CurTrader == "5ac3b934156ae10c4430e83c" || CurTrader == "5c0647fdd443bc2504c2d371" || CurTrader == "54cb50c76803fa8b248b4571" || CurTrader == "54cb57776803fa99248b456e" || CurTrader == "579dc571d53a0658a154fbec" || CurTrader == "5935c25fb3acc3127c3d8cd9" || CurTrader == "58330581ace78e27b8b10cee"))
				{
					for (let level in traders[CurTrader].base.loyaltyLevels)
					{
						traders[CurTrader].base.loyaltyLevels[level].repair_price_coef *= Config.Insurance.RepairBox.RepairMult;
					}
				}
			}
			if(Config.Insurance.RepairBox.OpArmorRepair)
			{
				for(let armormats in globals.ArmorMaterials)
				{
					globals.ArmorMaterials[armormats].MaxRepairDegradation = 0
					globals.ArmorMaterials[armormats].MinRepairDegradation = 0
					globals.ArmorMaterials[armormats].MaxRepairKitDegradation = 0
					globals.ArmorMaterials[armormats].MinRepairKitDegradation = 0
				}
			}
			if(Config.Insurance.RepairBox.OpGunRepair)
			{
				for(let stuff in items)
				{
					if(items[stuff]._props.MaxRepairDegradation !== undefined && items[stuff]._props.MaxRepairKitDegradation !== undefined)
					{
					EditSimpleItemData(stuff, "MinRepairDegradation", 0);
					EditSimpleItemData(stuff, "MaxRepairDegradation", 0);
					EditSimpleItemData(stuff, "MinRepairKitDegradation", 0);
					EditSimpleItemData(stuff, "MaxRepairKitDegradation",  0);

					}
				}
			}
			Logger.debug("SVM:Insurance settings enabled")
			//Repair.priceMultiplier = Config.Insurance.RepairBox.RepairMult; Disabled due to visual bug - it doesn't show converted number, the function itself is working tho
			Repair.armorKitSkillPointGainPerRepairPointMultiplier = Config.Insurance.RepairBox.RepairSkillPoint;
			Repair.applyRandomizeDurabilityLoss = !Config.Insurance.RepairBox.NoRandomRepair;
			if(Repair.maxIntellectGainPerRepair == undefined)
			{
				Logger.info("3.7.0 Detected, disabling Max Skill point acquired per repair")
			}
			else
			{
				Repair.maxIntellectGainPerRepair.kit = Config.Insurance.RepairBox.MaxSkillPointsPerRepair;
				Repair.maxIntellectGainPerRepair.trader = Config.Insurance.RepairBox.MaxSkillPointsPerRepair;
			}
			Insurance.insuranceMultiplier["54cb50c76803fa8b248b4571"] = Config.Insurance.InsuranceMultPrapor;
			Insurance.insuranceMultiplier["54cb57776803fa99248b456e"] = Config.Insurance.InsuranceMultTherapist;
			Insurance.returnChancePercent["54cb50c76803fa8b248b4571"] = Config.Insurance.ReturnChancePrapor;
			Insurance.returnChancePercent["54cb57776803fa99248b456e"] = Config.Insurance.ReturnChanceTherapist;
			globals.Insurance.MaxStorageTimeInHour = Config.Insurance.InsuranceStorageTime;						
			traders["54cb50c76803fa8b248b4571"].base.insurance.min_return_hour = Config.Insurance.InsuranceTime.Prapor_Min;
			traders["54cb50c76803fa8b248b4571"].base.insurance.max_return_hour = Config.Insurance.InsuranceTime.Prapor_Max;
			traders["54cb57776803fa99248b456e"].base.insurance.min_return_hour = Config.Insurance.InsuranceTime.Therapist_Min;
			traders["54cb57776803fa99248b456e"].base.insurance.max_return_hour = Config.Insurance.InsuranceTime.Therapist_Max;
		}
		//############## CSM SECTION ##################
		if (Config.CSM.EnableCSM)
		{
			if (Config.CSM.CustomPocket)
			{
				const JsonUtil = container.resolve("JsonUtil");
				let CustomPocketItem = JsonUtil.clone(items["627a4e6b255f7527fb05a0f6"])
				let PocketSize = Config.CSM.Pockets
				CustomPocketItem._id = "CustomPocket"
				CustomPocketItem._props.Grids[0]._id = "SVMPocket1"
				CustomPocketItem._props.Grids[0]._parent = "CustomPocket"
				CustomPocketItem._props.Grids[0]._props.cellsH = PocketSize.FirstH
				CustomPocketItem._props.Grids[0]._props.cellsV = PocketSize.FirstV
				CustomPocketItem._props.Grids[1]._id = "SVMPocket2"
				CustomPocketItem._props.Grids[1]._parent = "CustomPocket"
				CustomPocketItem._props.Grids[1]._props.cellsH = PocketSize.SecondH
				CustomPocketItem._props.Grids[1]._props.cellsV = PocketSize.SecondV
				CustomPocketItem._props.Grids[2]._id = "SVMPocket3"
				CustomPocketItem._props.Grids[2]._parent = "CustomPocket"
				CustomPocketItem._props.Grids[2]._props.cellsH = PocketSize.ThirdH
				CustomPocketItem._props.Grids[2]._props.cellsV = PocketSize.ThirdV
				CustomPocketItem._props.Grids[3]._id = "SVMPocket4"
				CustomPocketItem._props.Grids[3]._parent = "CustomPocket"
				CustomPocketItem._props.Grids[3]._props.cellsH = PocketSize.FourthH
				CustomPocketItem._props.Grids[3]._props.cellsV = PocketSize.FourthV
				CustomPocketItem._props.Slots[0]._id = "SVMSPEC1"
				CustomPocketItem._props.Slots[1]._id = "SVMSPEC2"
				CustomPocketItem._props.Slots[2]._id = "SVMSPEC3"
				CustomPocketItem._props.Slots[0]._parent = "CustomPocket"
				CustomPocketItem._props.Slots[1]._parent = "CustomPocket"
				CustomPocketItem._props.Slots[2]._parent = "CustomPocket"
				//CustomPocketItem._props.Slots[2] = undefined;
				//CustomPocketItem._props.Slots.splice(1,2);
				if (PocketSize.FourthH == 0 || PocketSize.FourthV == 0)
				{
					CustomPocketItem._props.Grids.splice(3,1);
				}
				if (PocketSize.ThirdH == 0 || PocketSize.ThirdV == 0)
				{
					CustomPocketItem._props.Grids.splice(2,1);
				}
				if (PocketSize.SecondH == 0 || PocketSize.SecondV == 0)
				{
					CustomPocketItem._props.Grids.splice(1,1);
				}
				if (PocketSize.FirstH == 0 || PocketSize.FirstV == 0)
				{
					CustomPocketItem._props.Grids.splice(0,1);
				}

				switch (Config.CSM.Pockets.SpecSlots)
				{
				case 0:
					CustomPocketItem._props.Slots.splice(0,3);
					break;
				case 1:
					CustomPocketItem._props.Slots.splice(1,2);
					break;
				case 2:
					CustomPocketItem._props.Slots.splice(2,1);
					break;
				case 3:
					break;
					case 4://This need to be fixed, i need to make it gradual for each additional pocket rather using break, will be fixed in future.
						//Logger.info(AddSpecPocket)
						CustomPocketItem._props.Slots[3] = JsonUtil.clone(CustomPocketItem._props.Slots[2])
						//CustomPocketItem_props.Slots[3]
						CustomPocketItem._props.Slots[3]._id = "SVMSPEC4"
						CustomPocketItem._props.Slots[3]._name = "SpecialSlot4"
						CustomPocketItem._props.Slots[3]._parent = "CustomPocket"
					break;
				case 5:
					CustomPocketItem._props.Slots[3] = JsonUtil.clone(CustomPocketItem._props.Slots[2])
					CustomPocketItem._props.Slots[4] = JsonUtil.clone(CustomPocketItem._props.Slots[2])
					CustomPocketItem._props.Slots[3]._id = "SVMSPEC4"
					CustomPocketItem._props.Slots[3]._name = "SpecialSlot4"
					CustomPocketItem._props.Slots[3]._parent = "CustomPocket"
					CustomPocketItem._props.Slots[4]._id = "SVMSPEC5"
					CustomPocketItem._props.Slots[4]._name = "SpecialSlot5"
					CustomPocketItem._props.Slots[4]._parent = "CustomPocket"
				break;
				}
				CustomPocketItem._props.HideEntrails = true;
				items["CustomPocket"] = CustomPocketItem;
				let IDsToFilter = ["5783c43d2459774bbe137486", "60b0f6c058e0b0481a09ad11", "619cbf9e0a7c3a1a2731940a","619cbf7d23893217ec30b689", "59fafd4b86f7745ca07e1232", "62a09d3bcf4a99369e262447"];
				let Pockets = Config.CSM.Pockets
				let CasesToFilter = [Pockets.SpecSimpleWallet, Pockets.SpecWZWallet, Pockets.SpecKeycardHolder, Pockets.SpecInjectorCase, Pockets.SpecKeytool, Pockets.SpecGKeychain];
				for (let specialslots in CustomPocketItem._props.Slots)
				{
					for(let element in IDsToFilter)
					{
						if(CasesToFilter[element])
						{
						//Logger.info(CustomPocketItem._props.Slots[specialslots]._props.filters[0].Filter)
						//Logger.error(IDsToFilter[element])
						CustomPocketItem._props.Slots[specialslots]._props.filters[0].Filter.push(IDsToFilter[element])
						//Logger.warning(CustomPocketItem._props.Slots[specialslots]._props.filters[0].Filter)
						}
					}
					//items[IDsToFilter[specialslots]]._props.HideEntrails = true;
				}
				items["5795f317245977243854e041"]._props.HideEntrails = true;
			}

			Logger.debug("SVM:CSM settings enabled")
			const Cases = Config.CSM.Cases
			const SecCon = Config.CSM.SecureContainers
			const SecConID = ["544a11ac4bdc2d470e8b456a", 
										  "5c093ca986f7740a1867ab12", 
										  "5857a8b324597729ab0a0e7d", 
										  "59db794186f77448bc595262", 
										  "5857a8bc2459772bad15db29"
			]
			const CasesID = ["59fb016586f7746d0d4b423a", 
										"5783c43d2459774bbe137486", 
										"60b0f6c058e0b0481a09ad11", 
										"5e2af55f86f7746d4159f07c", 
										"59fb042886f7746c5005a7b2", 
										"59fb023c86f7746d0d4b423c", 
										"5b7c710788a4506dec015957", 
										"5aafbde786f774389d0cbc0f", 
										"5c127c4486f7745625356c13", 
										"5c093e3486f77430cb02e593", 
										"5aafbcd986f7745e590fff23", 
										"5c0a840b86f7742ffa4f2482", 
										"5b6d9ce188a4501afc1b2b25", 
										"5d235bb686f77443f4331278", 
										"59fafd4b86f7745ca07e1232", 
										"590c60fc86f77412b13fddcf", 
										"567143bf4bdc2d1a0f8b4567", 
										"5c093db286f7740a1b2617e3", 
										"619cbf7d23893217ec30b689", 
										"619cbf9e0a7c3a1a2731940a",
										"62a09d3bcf4a99369e262447"
			]
			const Vsize = [
				Cases.MoneyCaseVSize,
				Cases.SimpleWalletVSize,
				Cases.WZWalletVSize,
				Cases.GrenadeCaseVSize,
				Cases.ItemsCaseVSize,
				Cases.WeaponCaseVSize,
				Cases.LuckyScavVSize,
				Cases.AmmunitionCaseVSize,
				Cases.MagazineCaseVSize,
				Cases.DogtagCaseVSize,
				Cases.MedicineCaseVSize,
				Cases.ThiccItemsCaseVSize,
				Cases.ThiccWeaponCaseVSize,
				Cases.SiccCaseVSize,
				Cases.KeytoolVSize,
				Cases.DocumentsCaseVSize,
				Cases.PistolCaseVSize,
				Cases.HolodilnickVSize,
				Cases.InjectorCaseVSize,
				Cases.KeycardHolderCaseVSize,
				Cases.GKeychainVSize
			]
			const Hsize = [
				Cases.MoneyCaseHSize,
				Cases.SimpleWalletHSize,
				Cases.WZWalletHSize,
				Cases.GrenadeCaseHSize,
				Cases.ItemsCaseHSize,
				Cases.WeaponCaseHSize,
				Cases.LuckyScavHSize,
				Cases.AmmunitionCaseHSize,
				Cases.MagazineCaseHSize,
				Cases.DogtagCaseHSize,
				Cases.MedicineCaseHSize,
				Cases.ThiccItemsCaseHSize,
				Cases.ThiccWeaponCaseHSize,
				Cases.SiccCaseHSize,
				Cases.KeytoolHSize,
				Cases.DocumentsCaseHSize,
				Cases.PistolCaseHSize,
				Cases.HolodilnickHSize,
				Cases.InjectorCaseHSize,
				Cases.KeycardHolderCaseHSize,
				Cases.GkeychainHSize,

			]
			const SecVsize = [SecCon.AlphaVSize,
				SecCon.KappaVSize,
				SecCon.BetaVSize,
				SecCon.EpsilonVSize,
				SecCon.GammaVSize
			];
			const SecHsize = [SecCon.AlphaHSize,
				SecCon.KappaHSize,
				SecCon.BetaHSize,
				SecCon.EpsilonHSize,
				SecCon.GammaHSize
			];
			const Filts = [
				Cases.MoneyCaseFilter,
				Cases.SimpleWalletFilter,
				Cases.WZWalletFilter,
				Cases.GrenadeCaseFilter,
				Cases.ItemsCaseFilter,
				Cases.WeaponCaseFilter,
				Cases.LuckyScavFilter,
				Cases.AmmunitionCaseFilter,
				Cases.MagazineCaseFilter,
				Cases.DogtagCaseFilter,
				Cases.MedicineCaseFilter,
				Cases.ThiccItemsCaseFilter,
				Cases.ThiccWeaponCaseFilter,
				Cases.SiccCaseFilter,
				Cases.KeytoolFilter,
				Cases.DocumentsCaseFilter,
				Cases.PistolCaseFilter,
				Cases.HolodilnickFilter,
				Cases.InjectorCaseFilter,
				Cases.KeycardHolderCaseFilter,
				Cases.GkeychainFilter
			]
			for (let SecConts in SecConID)
			{
				items[SecConID[SecConts]]._props.Grids[0]._props["cellsV"] = SecVsize[SecConts];
				items[SecConID[SecConts]]._props.Grids[0]._props["cellsH"] = SecHsize[SecConts];
			}
			for (let Case in CasesID)
			{
				items[CasesID[Case]]._props.Grids[0]._props["cellsV"] = Vsize[Case];
				items[CasesID[Case]]._props.Grids[0]._props["cellsH"] = Hsize[Case];
			}
			//Filters
			for (let Filters in Filts)
			{
				if (Filts[Filters]) // To check whether checkmark is true or false
				{
					items[CasesID[Filters]]._props.Grids[0]._props.filters = [];
				}
			}
		}
		//############## ITEMS SECTION ################
		if (Config.Items.EnableItems)
		{
			Logger.debug("SVM:Items settings enabled")
			//Price Modifier
			for (const item in DB.templates.handbook.Items)
			{
				if (DB.templates.handbook.Items[item].ParentId !== "5b5f78b786f77447ed5636af" && DB.templates.handbook.Items[item].Price != null)
				{
					DB.templates.handbook.Items[item].Price = (DB.templates.handbook.Items[item].Price * Config.Items.ItemPriceMult)
				}
			}
			//Loading-Unloading rounds in a magazine
			globals.BaseUnloadTime = globals.BaseUnloadTime * Config.Items.AmmoLoadSpeed;
			globals.BaseLoadTime = globals.BaseLoadTime * Config.Items.AmmoLoadSpeed;
			for (const id in items)
			{
				let base = items[id]
				//Examining time
				if(base._type == "Item" && base._props.ExamineTime !== undefined)
				{
					EditSimpleItemData(id, "ExamineTime", Config.Items.ExamineTime);
				}
				//Heat Factor Multiplier
				if (base._props.HeatFactor !== undefined)
				{
					EditSimpleItemData(id, "HeatFactor",parseFloat(base._props.HeatFactor * Config.Items.HeatFactor).toFixed(3));
				}
				//Dropping items in raid rather deleting them
				if(base._type == "Item" &&  base._props.DiscardLimit !== undefined && Config.Items.RaidDrop)
				{
					EditSimpleItemData(id, "DiscardLimit", -1);
				}
				//Turns off weapon overheat
				if (base._props.AllowOverheat !== undefined && Config.Items.WeaponHeatOff)
				{
					EditSimpleItemData(id, "AllowOverheat", false);
				}
				//Malfunction 
				if ((base._parent == "5447b5cf4bdc2d65278b4567" ||base._parent == "5447b6254bdc2dc3278b4568" || items[id]._parent == "5447b5f14bdc2d61278b4567" || items[id]._parent == "5447bed64bdc2d97278b4568" || items[id]._parent == "5447b6094bdc2dc3278b4567" || items[id]._parent == "5447b5e04bdc2d62278b4567" || items[id]._parent == "5447b6194bdc2d67278b4567") && items[id]._props.BaseMalfunctionChance !== undefined)
				{
					EditSimpleItemData(id,"BaseMalfunctionChance",parseFloat(base._props.BaseMalfunctionChance * Config.Items.MalfunctChanceMult).toFixed(4));
				}
				if (base._parent === "5448bc234bdc2d3c308b4569" && base._props.MalfunctionChance !== undefined)
				{
					EditSimpleItemData(id,"MalfunctionChance", parseFloat(base._props.MalfunctionChance* Config.Items.MalfunctChanceMult).toFixed(3));
				}
				//Misfire
				if (base._parent === "5485a8684bdc2da71d8b4567" && base._props.MisfireChance !== undefined)
				{
					EditSimpleItemData(id,"MisfireChance", parseFloat(base._props.MisfireChance * Config.Items.MisfireChance).toFixed(3));
				}
				//Examine all items - i THINK this could be simplified, but i'm lazy once again
				if (Config.Items.AllExaminedItems && Config.Items.ExamineKeys)
				{
					EditSimpleItemData(id, "ExaminedByDefault", true);
				}
				//Examine all items EXCEPT KEYS, checking for parent IDs of mechanical, keycards and keys in general just in case.
				else if(Config.Items.AllExaminedItems && base._parent !== "5c99f98d86f7745c314214b3" && base.parent !== "5c164d2286f774194c5e69fa" && base.parent !== "543be5e94bdc2df1348b4568")
				{
					EditSimpleItemData(id, "ExaminedByDefault", true);
				}
				//Change the weight
				if (base._type !== "Node" && base._type !== undefined && (base.parent !== "557596e64bdc2dc2118b4571" || base._parent !== "55d720f24bdc2d88028b456d"))
				{
					EditSimpleItemData(id, "Weight", parseFloat(Config.Items.WeightChanger * base._props.Weight).toFixed(3));
				}
				if (Config.Items.NoGearPenalty)
				{
					if (base._props.mousePenalty)
					{
						EditSimpleItemData(id, "mousePenalty", 0)
					}
					if (base._props.weaponErgonomicPenalty)
					{
						EditSimpleItemData(id, "weaponErgonomicPenalty", 0)
					}
					if (base._props.speedPenaltyPercent)
					{
						EditSimpleItemData(id, "speedPenaltyPercent", 0)
					}
				}
				//if (base._name.includes("patron"))// TODO: Add 357. because revolver.
				//
				if (base._parent.includes("5485a8684bdc2da71d8b4567"))
				{
					let str = base._name//.split("_", 2)
					let PistolRounds = ["9x19","9x18pm","9x21","762x25tt","46x30","57x28","1143x23","9x33r","10MM","40SW","357SIG","9MM","45ACP","50AE","380AUTO"]; //Rounds 
					let ShotgunRounds = ["12x70","20x70","23x75"];
					let RifleRounds = ["762x39", "545x39","556x45","9x39","366","762x35","300blk","ATL15","GRENDEL","50WLF","KURZ"];
					let MarksmanRounds = ["762x51","762х54R","762x54r","86x70","127x55","277","BMG"];
					if (AmmoFilter(PistolRounds,str))
					{
						EditSimpleItemData(id, "StackMaxSize", Config.Items.AmmoStacks.PistolRound)
					}
					else if(AmmoFilter(ShotgunRounds,str))
					{
						EditSimpleItemData(id, "StackMaxSize", Config.Items.AmmoStacks.ShotgunRound)
					}
					else if(AmmoFilter(RifleRounds,str))
					{
						EditSimpleItemData(id, "StackMaxSize", Config.Items.AmmoStacks.RifleRound)
					}
					else if(AmmoFilter(MarksmanRounds,str))
					{
						EditSimpleItemData(id, "StackMaxSize", Config.Items.AmmoStacks.MarksmanRound)
					}
				}
				//Change money stacks
				if (base._parent == "543be5dd4bdc2deb348b4569" && base._props.StackMaxSize !== undefined) 
				{
					if( base._id == "5696686a4bdc2da3298b456a" || base._id == "569668774bdc2da2298b4568")
					{
					EditSimpleItemData(id, "StackMaxSize", (Config.Items.CashStack / 10).toFixed()); //If it's Euros or Dollars - make stacks smaller by one digit, to fit live settings to a degree
					}
					else
					{
						EditSimpleItemData(id, "StackMaxSize", Config.Items.CashStack);
					}

				}
				//Allow armored rigs with armors
				if (Config.Items.EquipRigsWithArmors && base._props.BlocksArmorVest !== undefined)
				{
					EditSimpleItemData(id, "BlocksArmorVest", false);
				}
				//Remove filters
				if (Config.Items.RemoveSecureContainerFilters && base._parent == "5448bf274bdc2dfc2f8b456a" && base._props.Grids[0]._props.filters !== undefined)
				{
					base._props.Grids[0]._props.filters = [];
				}
				if (Config.Items.RemoveBackpacksRestrictions && base._parent == "5448e53e4bdc2d60728b4567" && base._props.Grids[0]._props.filters !== undefined)
				{
					base._props.Grids[0]._props.filters = [];
				}
				//Change items experience gain
				if (base._props.LootExperience !== undefined)
				{
					let calculation = Math.round(base._props.LootExperience * Config.Items.LootExp);
					EditSimpleItemData(id, "LootExperience", calculation);
				}
				if (base._props.ExamineExperience !== undefined)
				{
					let calculation = Math.round(base._props.ExamineExperience * Config.Items.ExamineExp);
					EditSimpleItemData(id, "ExamineExperience", calculation);
				}
				//Remove the keys usage
				if (Config.Items.RemoveKeysUsageNumber && (base._parent == "5c99f98d86f7745c314214b3" || base._parent == "5c164d2286f774194c5e69fa") && base._props.MaximumNumberOfUsage !== undefined)
				{
					base._props.MaximumNumberOfUsage = 0
				}
			}
			if (Config.Items.SMGToHolster)
			{
			items["55d7217a4bdc2d86028b456d"]._props.Slots[2]._props.filters[0].Filter.push("5447b5e04bdc2d62278b4567");
			}
			if (Config.Items.PistolToMain)
			{
			items["55d7217a4bdc2d86028b456d"]._props.Slots[0]._props.filters[0].Filter.push("5447b5cf4bdc2d65278b4567","617f1ef5e8b54b0998387733");
			items["55d7217a4bdc2d86028b456d"]._props.Slots[1]._props.filters[0].Filter.push("5447b5cf4bdc2d65278b4567","617f1ef5e8b54b0998387733");
			}
			if (Config.Items.RemoveRaidRestr)
			{
				globals.RestrictionsInRaid = []
			}
			if (Config.Items.IDChanger)
			{
				//Edit item properties, i know it looks stupid, but hey - it works and i like it.
				//Second revision, i've created a monster. now you can literally alter any field/filter/grid with it.
				//Third revision...I feel sad looking at this, this time is probably final, 10 fields including filters, less funcs this time
				// switch make it slightly effective in use comparing to previous version
				if (Config.Items.IDBox.length > 0)
				{
					Logger.info("SVM: Custom Properties enabled")
					try
					{
						for (let k in Config.Items.IDBox)
						{
							let fin = Config.Items.IDBox[k].split(":")
							Logger.info(fin)
							switch (fin.length)
							{
							case 3:
								if(fin[2].includes(",") || fin[2].includes("["))
								{
									items[fin[0]]._props[fin[1]] = Filter(fin[2])
								}
								else if (isNaN(fin[2]) && fin[2] !== 'true' && fin[2] !== 'false')
								{
									items[fin[0]]._props[fin[1]] = fin[2]
								}
								else
								{
									items[fin[0]]._props[fin[1]] = JSON.parse(fin[2])
								}
								break;
							case 4:
								if(fin[3].includes(",") || fin[3].includes("["))
								{
									items[fin[0]]._props[fin[1]][fin[2]] = Filter(fin[3])
								}
								else if (isNaN(fin[3]) && fin[3] !== 'true' && fin[3] !== 'false')
								{
									items[fin[0]]._props[fin[1]][fin[2]] = fin[3]
								}
								else
								{
									items[fin[0]]._props[fin[1]][fin[2]] = JSON.parse(fin[3])
								}
								break;
							case 5:
								if(fin[4].includes(",") || fin[4].includes("["))
								{
									items[fin[0]]._props[fin[1]][fin[2]][fin[3]] = Filter(fin[4])
								}
								else if (isNaN(fin[4]) && fin[4] !== 'true' && fin[4] !== 'false')
								{
									items[fin[0]]._props[fin[1]][fin[2]][fin[3]] = fin[4]
								}
								else
								{
									items[fin[0]]._props[fin[1]][fin[2]][fin[3]] = JSON.parse(fin[4])
								}
								break;
							case 6:
								if(fin[5].includes(",") || fin[5].includes("["))
								{
									items[fin[0]]._props[fin[1]][fin[2]][fin[3]][fin[4]] = Filter(fin[5])
								}
								else if (isNaN((fin[5])) && (fin[5]) !== 'true' && (fin[5]) !== 'false')
								{
									items[fin[0]]._props[fin[1]][fin[2]][fin[3]][fin[4]] = fin[5]
								}
								else
								{
									items[fin[0]]._props[fin[1]][fin[2]][fin[3]][fin[4]] = JSON.parse(fin[5])
								}
								break;
							case 7:
								if(fin[6].includes(",") || fin[6].includes("["))
								{
									items[fin[0]]._props[fin[1]][fin[2]][fin[3]][fin[4]][fin[5]] = Filter(fin[6])
								}
								else if (isNaN(fin[6]) && fin[6] !== 'true' && fin[6] !== 'false')
								{
									items[fin[0]]._props[fin[1]][fin[2]][fin[3]][fin[4]][fin[5]] = fin[6]
								}
								else
								{
									items[fin[0]]._props[fin[1]][fin[2]][fin[3]][fin[4]][fin[5]] = JSON.parse(fin[6])
								}
								break;
							case 8:
								if(fin[7].includes(",") || fin[7].includes("["))
								{
									items[fin[0]]._props[fin[1]][fin[2]][fin[3]][fin[4]][fin[5]][fin[6]] = Filter(fin[7])
								}
								else if (isNaN(fin[7]) && fin[7] !== 'true' && fin[7] !== 'false')
								{
									items[fin[0]]._props[fin[1]][fin[2]][fin[3]][fin[4]][fin[5]][fin[6]] = fin[7]
								}
								else
								{
									items[fin[0]]._props[fin[1]][fin[2]][fin[3]][fin[4]][fin[5]][fin[6]]  = JSON.parse(fin[7])
								}
								break;
							case 9:
								if(fin[8].includes(",") || fin[8].includes("["))
								{
									items[fin[0]]._props[fin[1]][fin[2]][fin[3]][fin[4]][fin[5]][fin[6]][fin[7]] = Filter(fin[8])
								}
								else if (isNaN(fin[8]) && fin[8] !== 'true' && fin[8] !== 'false')
								{
									items[fin[0]]._props[fin[1]][fin[2]][fin[3]][fin[4]][fin[5]][fin[6]][fin[7]] = fin[8]
								}
								else
								{
									items[fin[0]]._props[fin[1]][fin[2]][fin[3]][fin[4]][fin[5]][fin[6]][fin[7]] = JSON.parse(fin[8])
								}
								break;
							case 10:
								if(fin[8].includes(",") || fin[8].includes("["))
								{
									items[fin[0]]._props[fin[1]][fin[2]][fin[3]][fin[4]][fin[5]][fin[6]][fin[7]][fin[8]] = Filter(fin[9])
								}
								else if (isNaN(fin(9)) && fin(9) !== 'true' && fin(9) !== 'false')
								{
									items[fin[0]]._props[fin[1]][fin[2]][fin[3]][fin[4]][fin[5]][fin[6]][fin[7]][fin[8]]= fin[9]
								}
								else
								{
									items[fin[0]]._props[fin[1]][fin[2]][fin[3]][fin[4]][fin[5]][fin[6]][fin[7]][fin[8]] = JSON.parse(fin[9])
								}
								break;
						 	default:
							break;
							}
							//items[id]._props[extstructure][array][intstructure][data] = JSON.parse(value)
						}
						Logger.success("SVM: Custom properties successfully loaded")
					}
					catch (e)
					{
						Logger.error("SVM: Custom properties failed to load, error of the code:" + e)
					}
				}
			}
		}
		//############## PLAYER SECTION ###############
		if (Config.Player.EnablePlayer)
		{
			Logger.debug("SVM:Player settings enabled")
			//Skill box
			globals.SkillsSettings.SkillProgressRate = Config.Player.SkillProgMult;
			globals.SkillsSettings.WeaponSkillProgressRate = Config.Player.WeaponSkillMult;
			//health after raid box
			Health.healthMultipliers.death = Config.Player.DiedHealth.Health_death;
			Health.healthMultipliers.blacked = Config.Player.DiedHealth.Health_blacked;
			Health.save.health = Config.Player.DiedHealth.Savehealth;
			Health.save.effects = Config.Player.DiedHealth.Saveeffects;
			// skill eff box
			globals.SkillMinEffectiveness = Config.Player.Skills.SkillMinEffect;
			globals.SkillFatiguePerPoint = Config.Player.Skills.SkillFatiguePerPoint;
			globals.SkillFreshEffectiveness = Config.Player.Skills.SkillFreshEffect;
			globals.SkillFreshPoints = Config.Player.Skills.SkillFPoints;
			globals.SkillPointsBeforeFatigue = Config.Player.Skills.SkillPointsBeforeFatigue;
			globals.SkillFatigueReset = Config.Player.Skills.SkillFatigueReset;
			//############## Player level XP box ############## 
			globals.exp.kill.victimBotLevelExp = Config.Player.CharXP.ScavKill;
			globals.exp.kill.victimLevelExp = Config.Player.CharXP.PMCKill;
			globals.exp.kill.botHeadShotMult = Config.Player.CharXP.ScavHMult;
			globals.exp.kill.pmcHeadShotMult = Config.Player.CharXP.PMCHMult
			//############## END OF RAID Box ############## 
			globals.exp.match_end.runnerMult = Config.Player.RaidMult.Runner
			globals.exp.match_end.miaMult = Config.Player.RaidMult.MIA
			globals.exp.match_end.survivedMult = Config.Player.RaidMult.Survived
			globals.exp.match_end.killedMult = Config.Player.RaidMult.Killed
			//Remove fall damage
			if (Config.Player.FallDamage)
			{
				Logger.debug("SVM: Icarus wings granted");
				globals.Health.Falling.SafeHeight = 200
				globals.Health.Falling.DamagePerMeter = 0
			}
			//Change stamina (unlimited or no)
			if (Config.Player.MaxStamina !== 100 && !Config.Player.UnlimitedStamina)
			{
				Logger.debug("SVM: Custom maximum stamina activated");
				globals.Stamina.Capacity = Config.Player.MaxStamina;
			}
			else if (Config.Player.UnlimitedStamina)
			{
				Logger.debug("SVM: Unlimited stamina - granted");
				globals.Stamina.Capacity = 500;
				globals.Stamina.BaseRestorationRate = 500;
				globals.Stamina.StaminaExhaustionCausesJiggle = false;
				globals.Stamina.StaminaExhaustionStartsBreathSound = false;
				globals.Stamina.StaminaExhaustionRocksCamera = false;
				globals.Stamina.SprintDrainRate = 0;
				globals.Stamina.JumpConsumption = 0;
				globals.Stamina.AimDrainRate = 0;
				globals.Stamina.SitToStandConsumption = 0;
			}
			globals.Health.Effects.Existence.HydrationLoopTime = (globals.Health.Effects.Existence.HydrationLoopTime / Config.Player.HydrationLoss)
			globals.Health.Effects.Existence.EnergyLoopTime = (globals.Health.Effects.Existence.EnergyLoopTime / Config.Player.EnergyLoss)
			globals.Health.Effects.Existence.DestroyedStomachEnergyTimeFactor = Config.Player.BlackStomach;
			globals.Health.Effects.Existence.DestroyedStomachHydrationTimeFactor = Config.Player.BlackStomach;
		}
		//############## HIDEOUT SECTION ##############
		if (Config.Hideout.EnableHideout)
		{
			Logger.debug("SVM:Hideout settings enabled")
			//Change hideout fuel consumption
			hideout.settings.generatorFuelFlowRate = Config.Hideout.FuelConsumptionRate;
			hideout.settings.generatorSpeedWithoutFuel = Config.Hideout.NoFuelMult;
			//hideoutC.fuelDrainRateMultipler = Config.Hideout.FuelConsumptionRate;
			hideout.settings.airFilterUnitFlowRate = Config.Hideout.AirFilterRate;
			hideout.settings.gpuBoostRate = Config.Hideout.GPUBoostRate;
			//hideout.productions
			
			//Enable hideout fast constructions
			for (const data in hideout.areas)
			{
				let areaData = hideout.areas[data]
				for (const i in areaData.stages)
				{
					if (areaData.stages[i].constructionTime > 0)
					{
						areaData.stages[i].constructionTime = parseInt(areaData.stages[i].constructionTime * Config.Hideout.HideoutConstMult)
						if( areaData.stages[i].constructionTime < 1)
						{
							areaData.stages[i].constructionTime = 2
						}
					}
				}
			}
			//Enable fast hideout production
			for (const data in hideout.production)
			{
				let productionData = hideout.production[data];
				//Logger.info(productionData, "red")
				
					if (productionData._id == "5d5589c1f934db045e6c5492")
					{
						productionData.productionTime = Config.Hideout.WaterFilterTime * 60
						productionData.requirements[1].resource = Config.Hideout.WaterFilterRate
					}
					if (productionData._id == "5d5c205bd582a50d042a3c0e")
					{
						productionData.productionLimitCount = Config.Hideout.MaxBitcoins;
						productionData.productionTime = Config.Hideout.BitcoinTime * 60;
					}
				if (!productionData.continuous && productionData.productionTime >= 10)
				{
					productionData.productionTime = parseInt(productionData.productionTime * Config.Hideout.HideoutProdMult)
					if( productionData.productionTime < 1)
					{
						productionData.productionTime = 2
					}
				}
			}
			//Scav cases modifications
				for (const scav in hideout.scavcase)
				{
					let caseData = hideout.scavcase[scav];
					if (caseData.ProductionTime >= 10)
					{
						caseData.ProductionTime = parseInt(caseData.ProductionTime * Config.Hideout.ScavCaseTime);
						if( caseData.ProductionTime < 1)
						{
							caseData.ProductionTime = 2
						}
					}
				}
				for (const scase in hideout.scavcase)
				{
					let caseData = hideout.scavcase[scase];
					if (caseData.Requirements[0].templateId == "5449016a4bdc2d6f028b456f" || caseData.Requirements[0].templateId == "5696686a4bdc2da3298b456a" || caseData.Requirements[0].templateId == "569668774bdc2da2298b4568")
					{
						caseData.Requirements[0].count = parseInt(caseData.Requirements[0].count * Config.Hideout.ScavCasePrice);
					}
				}
			//Remove construction requirements
			if (Config.Hideout.RemoveConstructionsRequirements)
			{
				for (const data in hideout.areas)
				{
					let areaData = hideout.areas[data]
					for (const i in areaData.stages)
					{
						if (areaData.stages[i].requirements !== undefined)
						{
							areaData.stages[i].requirements = [];
						}
					}
				}
			}
		//Hideout regen menu
		globals.Health.Effects.Regeneration.BodyHealth.Head.Value *= Config.Hideout.Regeneration.HealthRegen
		globals.Health.Effects.Regeneration.BodyHealth.Chest.Value *= Config.Hideout.Regeneration.HealthRegen
		globals.Health.Effects.Regeneration.BodyHealth.Stomach.Value *= Config.Hideout.Regeneration.HealthRegen
		globals.Health.Effects.Regeneration.BodyHealth.LeftArm.Value *= Config.Hideout.Regeneration.HealthRegen
		globals.Health.Effects.Regeneration.BodyHealth.LeftLeg.Value *= Config.Hideout.Regeneration.HealthRegen
		globals.Health.Effects.Regeneration.BodyHealth.RightArm.Value *= Config.Hideout.Regeneration.HealthRegen
		globals.Health.Effects.Regeneration.BodyHealth.RightLeg.Value *= Config.Hideout.Regeneration.HealthRegen
		globals.Health.Effects.Regeneration.Energy = Config.Hideout.Regeneration.EnergyRegen
		globals.Health.Effects.Regeneration.Hydration = Config.Hideout.Regeneration.HydrationRegen

		for (const data in hideout.areas)
		{
			let areaData = hideout.areas[data]
			for (const i in areaData.stages)
			{
				for (const x in areaData.stages[i].bonuses)
				{
					if (Config.Hideout.Regeneration.HideoutHydration && areaData.stages[i].bonuses[x].type == "HydrationRegeneration")
					{
						areaData.stages[i].bonuses[x].value = 0;
					}
					if (Config.Hideout.Regeneration.HideoutEnergy && areaData.stages[i].bonuses[x].type == "EnergyRegeneration")
					{
						areaData.stages[i].bonuses[x].value = 0;
					}
					if (Config.Hideout.Regeneration.HideoutHealth && areaData.stages[i].bonuses[x].type == "HealthRegeneration")
					{
						areaData.stages[i].bonuses[x].value = 0;
					}
				}
			}
		}
		}
		//############## RAIDS SECTION ################
		if (Config.Raids.EnableRaids)
		{
			Logger.debug("SVM:Raids settings enabled")
			//############## INRAID SECTION ##################
			Inraid.MIAOnRaidEnd = Config.Raids.RaidStartup.MIAEndofRaid;
			Inraid.raidMenuSettings.aiAmount = Config.Raids.RaidStartup.AIAmount;
			Inraid.raidMenuSettings.aiDifficulty = Config.Raids.RaidStartup.AIDiffculty;
			Inraid.raidMenuSettings.bossEnabled = Config.Raids.RaidStartup.EnableBosses;
			Inraid.raidMenuSettings.scavWars = Config.Raids.RaidStartup.ScavWars;
			Inraid.raidMenuSettings.taggedAndCursed = Config.Raids.RaidStartup.TaggedAndCursed;
			Inraid.save.loot = Config.Raids.RaidStartup.SaveLoot;
			Inraid.save.durability = Config.Raids.RaidStartup.SaveDurability;
			//Logger.info(globals.WAVE_COEF_HIGH)
			globals.WAVE_COEF_HIGH =  Config.Raids.WaveMult.High;
			globals.WAVE_COEF_HORDE = Config.Raids.WaveMult.Horde;
			globals.WAVE_COEF_LOW = Config.Raids.WaveMult.Low;
			globals.WAVE_COEF_MID = Config.Raids.WaveMult.Medium;
			//Logger.warning(globals.WAVE_COEF_HIGH)
			const Midcore = configServer.getConfig("aki-lostondeath");
			if(Config.Raids.SaveQuestItems)
			{
				Midcore.questItems = false;
			}
			//Time acceleration
			WeatherValues.acceleration = Config.Raids.Timeacceleration
			//Deploy Window time
			globals.TimeBeforeDeployLocal = Config.Raids.RaidStartup.TimeBeforeDeployLocal
			//Always survived
			if (Config.Raids.NoRunThrough)
			{
				globals.exp.match_end.survived_exp_requirement = 0;
				globals.exp.match_end.survived_seconds_requirement = 0;
			}
			DB.locations["laboratory"].base.Insurance = Config.Raids.LabInsurance;
			//Remove labs entry keycard
			if (Config.Raids.Removelabkey)
			{
				Logger.debug("SVM: No key for lab activated");
				locations["laboratory"].base.AccessKeys = []
			}
			
			if(Config.Raids.Exfils.ArmorExtract)
			{
				globals.RequirementReferences.Alpinist.splice(2,1)
			}
			if(Config.Raids.Exfils.GearExtract)
			{
				globals.RequirementReferences.Alpinist.splice(0,2)
			}
			//Remove extracts restrictions
				for (let i in locations)
				{
					if (i !== "base")
					{
						for (let x in locations[i].base.exits)
						{
							if (locations[i].base.exits[x].Name !== "EXFIL_Train" && (!locations[i].base.exits[x].Name.includes("lab") || locations[i].base.exits[x].Name == "lab_Vent") && locations[i].base.exits[x].Name !== "Saferoom Exfil")
							{//Ok, i feel dumb again, but i was in a rush ok?

								if(Config.Raids.Exfils.GearExtract && Config.Raids.Exfils.ArmorExtract && locations[i].base.exits[x].PassageRequirement == "Reference" )
								{
									FreeExit(locations[i].base.exits[x])
								}
								if(Config.Raids.Exfils.NoBackpack && locations[i].base.exits[x].PassageRequirement == "Empty")
								{
									FreeExit(locations[i].base.exits[x])
								}

								if (locations[i].base.exits[x].PassageRequirement == "TransferItem")
								{
									locations[i].base.exits[x].ExfiltrationTime = Config.Raids.Exfils.CarExtractTime;
									switch (i)
									{
										case "woods":
											if(Config.Raids.Exfils.CarWoods !== 0)
											{
											locations[i].base.exits[x].Count = Config.Raids.Exfils.CarWoods;
											}
											else
											{
												FreeExit(locations[i].base.exits[x])
											}
											break;
										case "interchange":
											if(Config.Raids.Exfils.CarInterchange !== 0)
											{
											locations[i].base.exits[x].Count = Config.Raids.Exfils.CarInterchange;
											}
											else
											{
												FreeExit(locations[i].base.exits[x])
											}
											break;
										case "bigmap":
											if(Config.Raids.Exfils.CarCustoms !== 0)
											{
											locations[i].base.exits[x].Count = Config.Raids.Exfils.CarCustoms;
											}
											else
											{
												FreeExit(locations[i].base.exits[x])
											}
											break;
										case "tarkovstreets":
											if(Config.Raids.Exfils.CarStreets !== 0)
											{
											locations[i].base.exits[x].Count = Config.Raids.Exfils.CarStreets;
											}
											else
											{
												FreeExit(locations[i].base.exits[x])
											}
											break;
										case "lighthouse":
											if(Config.Raids.Exfils.CarLighthouse !== 0)
											{
											locations[i].base.exits[x].Count = Config.Raids.Exfils.CarLighthouse;
											}
											else
											{
												FreeExit(locations[i].base.exits[x])
											}
											break;
											default:
											break;
									}
								}
								if(Config.Raids.Exfils.CoopPaid && locations[i].base.exits[x].PassageRequirement == "ScavCooperation")
								{
									locations[i].base.exits[x].PassageRequirement = "TransferItem";
									locations[i].base.exits[x].ExfiltrationType = "SharedTimer";
									locations[i].base.exits[x].Id = "5449016a4bdc2d6f028b456f";
									locations[i].base.exits[x].PlayersCount = 0;
									locations[i].base.exits[x].RequirementTip = "EXFIL_Item";
									switch (i)
									{
										case "woods":
											if(Config.Raids.Exfils.CoopPaidWoods !== 0)
											{
												locations[i].base.exits[x].Count = Config.Raids.Exfils.CoopPaidWoods;
											}
											else
											{
												FreeExit(locations[i].base.exits[x])
											}
											break;
										case "tarkovstreets":
											if(Config.Raids.Exfils.CoopPaidStreets !== 0)
											{
												locations[i].base.exits[x].Count = Config.Raids.Exfils.CoopPaidStreets;
											}
											else
											{
												FreeExit(locations[i].base.exits[x])
											}
											break;
										case "interchange":
											if(Config.Raids.Exfils.CoopPaidInterchange !== 0)
											{
											locations[i].base.exits[x].Count = Config.Raids.Exfils.CoopPaidInterchange;
											}
											else
											{
												FreeExit(locations[i].base.exits[x])
											}
											break;
										case "lighthouse":
											if(Config.Raids.Exfils.CoopPaidLighthouse !== 0)
											{
												locations[i].base.exits[x].Count = Config.Raids.Exfils.CoopPaidLighthouse;
											}
											else
											{
												FreeExit(locations[i].base.exits[x])
											}
											break;
										case "rezervbase":
											if(Config.Raids.Exfils.CoopPaidReserve !== 0)
											{
											locations[i].base.exits[x].Count = Config.Raids.Exfils.CoopPaidReserve;
											}
											else
											{
												FreeExit(locations[i].base.exits[x])
											}
											break;
											default:
												break;
									}
								}

								if(Config.Raids.Exfils.FreeCoop && locations[i].base.exits[x].PassageRequirement == "ScavCooperation")
								{
									FreeExit(locations[i].base.exits[x])
								}

								/*    "EntryPoints": "House,Old Station",
									"ExfiltrationTime": 60,
									"ExfiltrationType": "SharedTimer",
									"PassageRequirement": "TransferItem",
									"RequirementTip": "EXFIL_Item" */	
							}
						}
					}
				}
			//Make all extractions available to extract
			if (Config.Raids.Exfils.ChanceExtracts)
			{
				Logger.debug("SVM: Every chance based extract is always available");
				for (let i in locations)
				{
					if (i !== "base")
					{
						for (let x in locations[i].base.exits)
						{
							if (locations[i].base.exits[x].Name !== "EXFIL_Train")
							{
								locations[i].base.exits[x].Chance = 100;
							}
						}
					}
				}
			}
			//Extend raids time
			if (Config.Raids.RaidTime != 0)
			{
				Logger.debug("SVM: Extended Raid activated");
				for (let map in locations)
				{
					if (map !== "base") 
					{
						if (isJSONValueDefined(locations[map].base.exit_access_time)) 
						{
							locations[map].base.exit_access_time += Config.Raids.RaidTime
						}
						if (isJSONValueDefined(locations[map].base.EscapeTimeLimit)) 
						{
							locations[map].base.EscapeTimeLimit += Config.Raids.RaidTime
						}    
					}
				}
			}
			//Make all extractions of the map available regardless of the infill
			if (Config.Raids.Exfils.ExtendedExtracts)
			{
				Logger.debug("SVM: All extractions of the map available regardless of the infiltration");
				for (let map in locations)
				{
					switch (map)
					{
						case "base":
							break;
						case "bigmap":
							for (const extract in locations[map].base.exits)
							{
								locations[map].base.exits[extract].EntryPoints = "Customs,Boiler Tanks"
							}
							break;
						case "interchange":
							for (const extract in locations[map].base.exits)
							{
								locations[map].base.exits[extract].EntryPoints = "MallSE,MallNW"
							}
							break;
						case "shoreline":
							for (const extract in locations[map].base.exits)
							{
								locations[map].base.exits[extract].EntryPoints = "Village,Riverside"
							}
							break;
						case "woods":
							for (const extract in locations[map].base.exits)
							{
								locations[map].base.exits[extract].EntryPoints = "House,Old Station"
							}
							break;
						case "lighthouse":
							for (const extract in locations[map].base.exits)
							{
								locations[map].base.exits[extract].EntryPoints = "Tunnel,North"
							}
							break;
						case "tarkovstreets":
							for (const extract in locations[map].base.exits)
							{
								locations[map].base.exits[extract].EntryPoints = "E1_2,E6_1,E2_3,E3_4,E4_5,E5_6,E6_1"
							}
							break;
						default:
							break;
					}
				}
			}
			if (Config.Raids.RaidEvents.Christmas)
			{
				globals.EventType = ["Christmas"];
			}
			if (Config.Raids.RaidEvents.Halloween)
			{
				globals.EventType = ["Halloween", "HalloweenIllumination"];
			}
			if (Config.Raids.RaidEvents.KillaFactory)
			{
				const KillaWave = CreateBoss("bossKilla", Config.Raids.RaidEvents.KillaFactoryChance, "followerBully", 0, locations["factory4_day"].base.OpenZones)
				locations["factory4_day"].base.BossLocationSpawn.push(KillaWave)
				locations["factory4_night"].base.BossLocationSpawn.push(KillaWave)
			}
			if (Config.Raids.RaidEvents.BossesOnReserve)
			{
				let BossWave = CreateBoss("bossKilla", 100, "followerBully", 0, locations["rezervbase"].base.OpenZones)
				locations["rezervbase"].base.BossLocationSpawn.push(BossWave)
				BossWave = CreateBoss("bossBully", 100, "followerBully", 4, locations["rezervbase"].base.OpenZones)
				locations["rezervbase"].base.BossLocationSpawn.push(BossWave)
				BossWave = CreateBoss("bossKojaniy", 100, "followerKojaniy", 2, locations["rezervbase"].base.OpenZones)
				locations["rezervbase"].base.BossLocationSpawn.push(BossWave)
				BossWave = CreateBoss("bossSanitar", 100, "followerSanitar", 2, locations["rezervbase"].base.OpenZones)
				locations["rezervbase"].base.BossLocationSpawn.push(BossWave)
				if (Config.Raids.RaidEvents.IncludeTagilla)
				{
					BossWave = CreateBoss("bossTagilla", 100, "followerBully", 0, locations["rezervbase"].base.OpenZones)
					locations["rezervbase"].base.BossLocationSpawn.push(BossWave)
				}
			}	
			if(Config.Raids.RaidEvents.BossesOnCustoms)
			{
				for( let bosses in locations["bigmap"].base.BossLocationSpawn)
				{
					if (locations["bigmap"].base.BossLocationSpawn[bosses].BossName == "bossBully")
					{
						locations["bigmap"].base.BossLocationSpawn[bosses].BossChance = 100;
					}
				}
				let BossWave = CreateBoss("bossKilla", 100, "followerBully", 0, "ZoneOldAZS")
				locations["bigmap"].base.BossLocationSpawn.push(BossWave)

				BossWave = CreateBoss("bossKojaniy", 100, "followerKojaniy", 2, "ZoneFactoryCenter")
				locations["bigmap"].base.BossLocationSpawn.push(BossWave)

				BossWave = CreateBoss("bossSanitar", 100, "followerSanitar", 2,  "ZoneGasStation")
				locations["bigmap"].base.BossLocationSpawn.push(BossWave)

				BossWave = CreateBoss("bossTagilla", 100, "followerBully", 0,  "ZoneOldAZS")
				locations["bigmap"].base.BossLocationSpawn.push(BossWave)

				const Glukhar = {
					"BossName": "bossGluhar",
					"BossChance": 100,
					"BossZone": "ZoneScavBase",
					"BossPlayer": false,
					"BossDifficult": "normal",
					"BossEscortType": "followerGluharAssault",
					"BossEscortDifficult": "normal",
					"BossEscortAmount": "0",
					"Time": -1,
					"TriggerId": "",
					"TriggerName": "",
					"Supports": [
					{
						"BossEscortType": "followerGluharAssault",
						"BossEscortDifficult": ["normal"],
						"BossEscortAmount": "2"
					},
					{
						"BossEscortType": "followerGluharSecurity",
						"BossEscortDifficult": ["normal"],
						"BossEscortAmount": "2"
					},
					{
						"BossEscortType": "followerGluharScout",
						"BossEscortDifficult": ["normal"],
						"BossEscortAmount": "2"
					}]
				}
				locations["bigmap"].base.BossLocationSpawn.push(Glukhar)

			}
			if (Config.Raids.RaidEvents.GoonsFactory)
			{
				const GoonsFac = {
					"BossChance": Config.Raids.RaidEvents.GoonsFactoryChance,
					"BossDifficult": "normal",
					"BossEscortAmount": "2",
					"BossEscortDifficult": "normal",
					"BossEscortType": "exUsec",
					"BossName": "bossKnight",
					"BossPlayer": false,
					"BossZone": "BotZone",
					"RandomTimeSpawn": true,
					"Supports": [
					  {
						"BossEscortAmount": "1",
						"BossEscortDifficult": [
						  "normal"
						],
						"BossEscortType": "followerBigPipe"
					  },
					  {
						"BossEscortAmount": "1",
						"BossEscortDifficult": [
						  "normal"
						],
						"BossEscortType": "followerBirdEye"
					  },
					  {
						"BossEscortAmount": "0",
						"BossEscortDifficult": [
						  "normal"
						],
						"BossEscortType": "followerGluharScout" //Don't ask, took straight from location data, it's the same for Customs and Woods.
					  }
					],
					"Time": -1
				}
				locations["factory4_day"].base.BossLocationSpawn.push(GoonsFac)
				locations["factory4_night"].base.BossLocationSpawn.push(GoonsFac)
			}
			if (Config.Raids.RaidEvents.GlukharLabs)
			{
				const Glukhar = {
					"BossName": "bossGluhar",
					"BossChance": 43,
					"BossZone": "BotZoneFloor1,BotZoneFloor2",
					"BossPlayer": false,
					"BossDifficult": "normal",
					"BossEscortType": "followerGluharAssault",
					"BossEscortDifficult": "normal",
					"BossEscortAmount": "0",
					"Time": -1,
					"TriggerId": "",
					"TriggerName": "",
					"Supports": [
					{
						"BossEscortType": "followerGluharAssault",
						"BossEscortDifficult": ["normal"],
						"BossEscortAmount": "2"
					},
					{
						"BossEscortType": "followerGluharSecurity",
						"BossEscortDifficult": ["normal"],
						"BossEscortAmount": "2"
					},
					{
						"BossEscortType": "followerGluharScout",
						"BossEscortDifficult": ["normal"],
						"BossEscortAmount": "2"
					}]
				}
				//Glukhar.BossZone = locations["laboratory"].base.OpenZones
				locations["laboratory"].base.BossLocationSpawn.push(Glukhar)
			}
				for (let i in locations)//Bloodhounds events spawn chance - this is bad solution, but i made it on a quick hand, not sure this event lasts either.
				{
					if (i !== "base" && locations[i].base.BossLocationSpawn)
					{
						for (let x in locations[i].base.BossLocationSpawn)
						{

							if(locations[i].base.BossLocationSpawn[x].BossName == "arenaFighterEvent" && i == "bigmap")
							{
								locations[i].base.BossLocationSpawn[x].BossChance = Config.Raids.RaidEvents.HoundsCustoms
							}
							if(locations[i].base.BossLocationSpawn[x].BossName == "arenaFighterEvent" && i == "woods")
							{
								locations[i].base.BossLocationSpawn[x].BossChance = Config.Raids.RaidEvents.HoundsWoods
							}
							if(locations[i].base.BossLocationSpawn[x].BossName == "arenaFighterEvent" && i == "shoreline")
							{
								locations[i].base.BossLocationSpawn[x].BossChance = Config.Raids.RaidEvents.HoundsShoreline
							}
						}
					}
				}

		}
		//############## TRADERS SECTION ##############
		if (Config.Traders.EnableTraders)
		{
			trader.fence.assortSize = Config.Traders.Fence.FenceAmountOnSale;
			trader.fence.discountOptions.assortSize = Config.Traders.Fence.FencePremiumAmountOnSale;
			trader.fence.maxPresetsPercent = Config.Traders.Fence.FencePresetCount
			trader.fence.presetPriceMult = Config.Traders.Fence.FencePresetMult
			trader.fence.itemPriceMult = Config.Traders.Fence.FencePriceMult;

			trader.fence.blacklist =  Config.Traders.FenceBlacklist;

			trader.fence.presetMaxDurabilityPercentMinMax.min = Config.Traders.Fence.FenceGunDurability_Min
			trader.fence.presetMaxDurabilityPercentMinMax.max = Config.Traders.Fence.FenceGunDurability_Max
			trader.fence.armorMaxDurabilityPercentMinMax.min = Config.Traders.Fence.FenceArmorDurability_Min
			trader.fence.armorMaxDurabilityPercentMinMax.max = Config.Traders.Fence.FenceArmorDurability_Max

			globals.TradingSettings.BuyoutRestrictions.MinDurability =  Config.Traders.MinDurabSell / 100
			Quest.redeemTime = Config.Traders.QuestRedeemTime;
			for ( let tradertime in trader.updateTime)
			{
				trader.updateTime[tradertime].seconds = Config.Traders.StockTime*60;
			}
			//trader.updateTimeDefault = Config.Traders.StockTime*60;

			
			trader.purchasesAreFoundInRaid = Config.Traders.FIRTrade;

			const Mark = Config.Traders.TraderMarkup;
			const MarkArray = [Mark.PraporMarkup,
				Mark.TherapistMarkup,
				Mark.FenceMarkup,
				Mark.SkierMarkup,
				Mark.PeacekeeperMarkup,
				Mark.MechanicMarkup,
				Mark.RagmanMarkup,
				Mark.JaegerMarkup
			]
			let i = 0;
			for (let CurTrader in traders)
			{
				if (CurTrader !== "ragfair" && (CurTrader == "5a7c2eca46aef81a7ca2145d" || CurTrader == "5ac3b934156ae10c4430e83c" || CurTrader == "5c0647fdd443bc2504c2d371" || CurTrader == "54cb50c76803fa8b248b4571" || CurTrader == "54cb57776803fa99248b456e" || CurTrader == "579dc571d53a0658a154fbec" || CurTrader == "5935c25fb3acc3127c3d8cd9" || CurTrader == "58330581ace78e27b8b10cee"))
				{
					for (let level in traders[CurTrader].base.loyaltyLevels)
					{
						traders[CurTrader].base.loyaltyLevels[level].buy_price_coef = 100 - MarkArray[i]
					}
					i++
				}
			}
			if (Config.Traders.EnableHealMarkup)
			{
				for (let level in traders["54cb57776803fa99248b456e"].base.loyaltyLevels)
				{
					traders["54cb57776803fa99248b456e"].base.loyaltyLevels[level].heal_price_coef = Config.Traders.HealMarkup.TherapistHealMarkup
				}
			}
			//Enable all the quests
			if (Config.Traders.AllQuestsAvailable)
			{
				Logger.debug("SVM: All Quests are Available");
				for (let id in Quests)
				{
					let QuestData = Quests[id]
					QuestData.conditions.AvailableForStart = [
					{
						"_parent": "Level",
						"_props":
						{
							"compareMethod": ">=",
							"value": "1",
							"index": 0,
							"parentId": "",
							"id": "SVM: AllQuestsAvailable"
						}
					}]
				}
			}
			if (Config.Traders["FIRRestrictsQuests"])
			{
				Logger.debug("SVM: No more FIR requirements in quests");
				for (const id in Quests)
				{
					let condition = Quests[id].conditions.AvailableForFinish
					for (const requirements in condition)
					{
						let requirement = condition[requirements]
						if (requirement._parent == "FindItem" || requirement._parent == "HandoverItem")
						{
							if ('_props' in requirement && 'onlyFoundInRaid' in requirement._props)
							{
								requirement._props.onlyFoundInRaid = false
							}
						}
					}
				}
			}
			//Enable all clothes available for both side
			if (Config.Traders.ClothesAnySide)
			{
				Logger.debug("SVM: All fashion unlocked");
				for (let suit in suits)
				{
					let suitData = suits[suit]
					if (suitData._parent === "5cd944ca1388ce03a44dc2a4" || suitData._parent === "5cd944d01388ce000a659df9")
					{
						suitData._props.Side = ["Bear", "Usec"];
					}
				}
			}
			if (Config.Traders.AllClothesFree)
			{
				for (let tradercloth in traders)
				{
					if (traders[tradercloth].suits)
					{
						for (let file in traders[tradercloth].suits)
						{
							let fileData = traders[tradercloth].suits[file]
							fileData.requirements.loyaltyLevel = 1;
							fileData.requirements.profileLevel = 1;
							fileData.requirements.standing = 0;
							fileData.requirements.skillRequirements = [];
							fileData.requirements.questRequirements = [];
							fileData.requirements.itemRequirements = [];
						}
					}
				}
			}
			//Enable all traders 4 stars
			if (Config.Traders.TradersLvl4)
			{
				Logger.debug("SVM: Lvl 4 Traders activated")
				for (let traderID in traders)
				{
					let loyaltyLevels = traders[traderID].base.loyaltyLevels;
					for (let level in loyaltyLevels)
					{
						loyaltyLevels[level].minLevel = 1
						loyaltyLevels[level].minSalesSum = 0
						loyaltyLevels[level].minStanding = 0
					}
				}
			}
			if (Config.Traders.RemoveTradeLimits)
			{
				for (let AssortR in traders)
				{
					if (AssortR !== "ragfair" && AssortR !==  "638f541a29ffd1183d187f57")
					{
						for (let level in traders[AssortR].assort.items)
						{
							if (traders[AssortR].assort.items[level].upd !== undefined && traders[AssortR].assort.items[level].upd["BuyRestrictionMax"] !== undefined)
							{
								delete traders[AssortR].assort.items[level].upd["BuyRestrictionMax"]
							}
						}
					}
				}
			}
		}
		//############## PMC SECTION ##################,
		if (BL.EnableAdvLoad)
		{
			Logger.debug("SVM: PMC section is on")
			//Logger.info(PMC.convertIntoPmcChance)
			PMC.convertIntoPmcChance.assault.min = BL.AItoPMC.PMCtoScav;
			PMC.convertIntoPmcChance.cursedassault.min = BL.AItoPMC.PMCtoCursedScav;
			PMC.convertIntoPmcChance.pmcbot.min = BL.AItoPMC.PMCtoRaider;
			PMC.convertIntoPmcChance.exusec.min = BL.AItoPMC.ExusectoPMC;
			PMC.convertIntoPmcChance.marksman = {};
			PMC.convertIntoPmcChance.marksman.min = BL.AItoPMC.SnipertoPMC;

			PMC.convertIntoPmcChance.assault.max = BL.AItoPMC.PMCtoScav;
			PMC.convertIntoPmcChance.cursedassault.max = BL.AItoPMC.PMCtoCursedScav;
			PMC.convertIntoPmcChance.pmcbot.max = BL.AItoPMC.PMCtoRaider;
			PMC.convertIntoPmcChance.exusec.max = BL.AItoPMC.ExusectoPMC;
			PMC.convertIntoPmcChance.marksman.max = BL.AItoPMC.SnipertoPMC;
			PMC.isUsec = BL.PMCRatio;
			PMC.chanceSameSideIsHostilePercent = BL.PMCChance.HostilePMC;
			PMC.botRelativeLevelDeltaMax = BL.LevelMargin;
			PMC.looseWeaponInBackpackChancePercent = BL.PMCChance.PMCLooseWep;
			PMC.weaponHasEnhancementChancePercent = BL.PMCChance.PMCWepEnhance;
			PMC.addPrefixToSameNamePMCAsPlayerChance = BL.PMCChance.PMCNamePrefix;
			PMC.allPMCsHavePlayerNameWithRandomPrefixChance = BL.PMCChance.PMCAllNamePrefix;
			//Logger.warning(PMC.convertIntoPmcChance)
			if (BL.ForceCustomWaves)
			{
				//Logger.info(locs.customWaves.boss)
				for(let wavemaps in locs.customWaves.boss)
				{
					for(let pmcwaves in locs.customWaves.boss[wavemaps])
					{
						locs.customWaves.boss[wavemaps][pmcwaves].BossChance = 100;
					}
				}
			}

			// BL redirects

			const AddKeys = [];
			const AddContainers = [];
			const CurUsec = "usec"
			const CurBear = "bear"//someone will call me stupid, but there were changes related on what file to read to actually apply on PMCs.
			const bottypes = [
				CurBear, "assault","cursedassault","crazyassaultevent",
				CurUsec, "pmcbot", "marksman", "exusec"
			];
			const bannedkeys = ["57518fd424597720c85dbaaa","57518f7724597720a31c09ab","63a71f3b0aa9fb29da61c539",
								"63a71f1a0aa9fb29da61c537","63a39e6acd6db0635c1975fe","63a39e0f64283b5e9c56b282",
								"5671446a4bdc2d97058b4569","63a39e5b234195315d4020bf","590de4a286f77423d9312a32",
								"590de52486f774226a0c24c2","5751916f24597720a27126df","5a043f2c86f7741aa57b5145",
								"5751961824597720a31c09ac"]
			for (const id in items)
			{
				let base = items[id]
				//BL pos
				//Add keys, exclude test ones - had to add for and if for that, it's just too many.
				if ((base._parent === "5c99f98d86f7745c314214b3" || base._parent === "5c164d2286f774194c5e69fa") && BL.AddAllKeys)
				{
					if(!bannedkeys.includes(base._id))
					{
						AddKeys.push(base._id)
					}
				}
				if ((base._id === "567143bf4bdc2d1a0f8b4567" || base._parent === "5795f317245977243854e041") && BL.AddAllContainers)
				{
					AddContainers.push(base._id)
				}
				if (base._parent === "5447e1d04bdc2dff2f8b4567" && base._id !== "6087e570b998180e9f76dc24" && BL.LootableMelee)
				{
					EditSimpleItemData(id, "Unlootable", false);
					items[id]._props.UnlootableFromSide = [];
				}
			}
			if(BL.PMCOverride)
			{
				Bots.equipment.pmc.randomisation[0].levelRange.max = 1;
			}
			
			if (BL.AddAllKeys || BL.AddAllContainers)
			{
				for (const i in AddKeys)
				{
					let id = AddKeys[i]
					for (const type in bottypes)
					{

						let role = bottypes[type]
						if (!Bot[role].inventory.items.Pockets[id])
						{
							Bot[role].inventory.items.Pockets.push(id)
						}
					}
				}
				for (const i in AddContainers)
				{
					let id = AddContainers[i]
					for (const type in bottypes)
					{
						let role = bottypes[type]
						if (!Bot[role].inventory.items.Backpack[id])
						{
							Bot[role].inventory.items.Backpack.push(id)
						}
					}
				}
			}
			if (BL.BearNamesEnable) //nasty double IF
			{
				if(BL.BearNamesEnable && BL.BearNameOverride)
				{
					Bot[CurBear].firstName = BL.BearNameList
				}
				else
				{
					for (const name in BL.BearNameList)
					{
						Bot[CurBear].firstName.push(BL.BearNameList[name])
					}
				}
			}
			if (BL.UsecNamesEnable)
			{
				if(BL.UsecNamesEnable && BL.UsecNameOverride)
				{
					Bot[CurUsec].firstName = BL.UsecNameList;
				}
				else
				{
					for (const name in BL.BearNameList)
					{
						Bot[CurUsec].firstName.push(BL.UsecNameList[name])
					}
				}
			}				
		}
		//############## QUESTS ############# It'll be straightforward as possible for now in sake of tests, i may shortify and push an array later.
		//Someone might hate me here in words repetetiveness, but i couldn't do otherwise,the name of the structure is DailyQuests and WeeklyQuests, and then every variable should have unique name
		//I know how to fix it, but i'm still lazy to do so ;-;
		//Now i had to add scav quests too, this section is bad.
		if (Config.Quests.EnableQuests)
		{
			const Daily = Config.Quests.DailyQuests;
			const Weekly = Config.Quests.WeeklyQuests;
			const ScavDaily = Config.Quests.ScavQuests;
			//Daily
			Quest.repeatableQuests[0].resetTime = Daily.DailyLifespan*60;
			Quest.repeatableQuests[0].types = Daily.DailyTypes;
			Quest.repeatableQuests[0].numQuests = Daily.DailyQuestAmount;
			Quest.repeatableQuests[0].minPlayerLevel = Daily.DailyAccess;
			Quest.repeatableQuests[0].rewardScaling.levels = Daily.DailyLevels;
			Quest.repeatableQuests[0].rewardScaling.experience = Daily.DailyExp;
			Quest.repeatableQuests[0].rewardScaling.roubles = Daily.DailyRoubles;
			Quest.repeatableQuests[0].rewardScaling.items = Daily.DailyItems;
			Quest.repeatableQuests[0].rewardScaling.reputation = Daily.DailyReputation;
			Quest.repeatableQuests[0].rewardScaling.rewardSpread = Daily.DailySpread;
			Quest.repeatableQuests[0].questConfig.Exploration.maxExtracts = Daily.DailyExtracts;
			Quest.repeatableQuests[0].questConfig.Completion.minRequestedAmount = Daily.DailyMinItems;
			Quest.repeatableQuests[0].questConfig.Completion.maxRequestedAmount = Daily.DailyMaxItems;

			Quest.repeatableQuests[0].questConfig.Elimination[0].minKills = Daily.DailyMinKillsLR1;
			Quest.repeatableQuests[0].questConfig.Elimination[0].maxKills = Daily.DailyMaxKillsLR1;
			Quest.repeatableQuests[0].questConfig.Elimination[1].minKills = Daily.DailyMinKillsLR2;
			Quest.repeatableQuests[0].questConfig.Elimination[1].maxKills = Daily.DailyMaxKillsLR2;
			Quest.repeatableQuests[0].questConfig.Elimination[2].minKills = Daily.DailyMinKillsLR3;
			Quest.repeatableQuests[0].questConfig.Elimination[2].maxKills = Daily.DailyMaxKillsLR3;
			//Weekly
			Quest.repeatableQuests[1].resetTime = Weekly.WeeklyLifespan*60;
			Quest.repeatableQuests[1].types = Weekly.WeeklyTypes;
			Quest.repeatableQuests[1].numQuests = Weekly.WeeklyQuestAmount;
			Quest.repeatableQuests[1].minPlayerLevel = Weekly.WeeklyAccess;
			Quest.repeatableQuests[1].rewardScaling.levels = Weekly.WeeklyLevels;
			Quest.repeatableQuests[1].rewardScaling.experience = Weekly.WeeklyExp;
			Quest.repeatableQuests[1].rewardScaling.roubles = Weekly.WeeklyRoubles;
			Quest.repeatableQuests[1].rewardScaling.items = Weekly.WeeklyItems;
			Quest.repeatableQuests[1].rewardScaling.reputation = Weekly.WeeklyReputation;
			Quest.repeatableQuests[1].rewardScaling.rewardSpread = Weekly.WeeklySpread;
			Quest.repeatableQuests[1].questConfig.Exploration.maxExtracts = Weekly.WeeklyExtracts;
			Quest.repeatableQuests[1].questConfig.Completion.minRequestedAmount = Weekly.WeeklyMinItems;
			Quest.repeatableQuests[1].questConfig.Completion.maxRequestedAmount = Weekly.WeeklyMaxItems;
			Quest.repeatableQuests[1].questConfig.Elimination[0].minKills = Weekly.WeeklyMinKillsLR1;
			Quest.repeatableQuests[1].questConfig.Elimination[0].maxKills = Weekly.WeeklyMaxKillsLR1;
			Quest.repeatableQuests[1].questConfig.Elimination[1].minKills = Weekly.WeeklyMinKillsLR2;
			Quest.repeatableQuests[1].questConfig.Elimination[1].maxKills = Weekly.WeeklyMaxKillsLR2;
			Quest.repeatableQuests[1].questConfig.Elimination[2].minKills = Weekly.WeeklyMinKillsLR3;
			Quest.repeatableQuests[1].questConfig.Elimination[2].maxKills = Weekly.WeeklyMaxKillsLR3;
			//Scav Daily
			Quest.repeatableQuests[2].resetTime = ScavDaily.ScavDailyLifespan*60;
			Quest.repeatableQuests[2].types = ScavDaily.ScavDailyTypes;
			Quest.repeatableQuests[2].numQuests = ScavDaily.ScavDailyQuestAmount;
			Quest.repeatableQuests[2].minPlayerLevel = ScavDaily.ScavDailyAccess;
			Quest.repeatableQuests[2].rewardScaling.levels = ScavDaily.ScavDailyLevels;
			Quest.repeatableQuests[2].rewardScaling.experience = ScavDaily.ScavDailyExp;
			Quest.repeatableQuests[2].rewardScaling.roubles = ScavDaily.ScavDailyRoubles;
			Quest.repeatableQuests[2].rewardScaling.items = ScavDaily.ScavDailyItems;
			Quest.repeatableQuests[2].rewardScaling.reputation = ScavDaily.ScavDailyReputation;
			Quest.repeatableQuests[2].rewardScaling.rewardSpread = ScavDaily.ScavDailySpread;
			Quest.repeatableQuests[2].questConfig.Exploration.maxExtracts = ScavDaily.ScavDailyExtracts;
			Quest.repeatableQuests[2].questConfig.Completion.minRequestedAmount = ScavDaily.ScavDailyMinItems;
			Quest.repeatableQuests[2].questConfig.Completion.maxRequestedAmount = ScavDaily.ScavDailyMaxItems;
			Quest.repeatableQuests[2].questConfig.Elimination[0].minKills = ScavDaily.ScavDailyMinKillsLR1;
			Quest.repeatableQuests[2].questConfig.Elimination[0].maxKills = ScavDaily.ScavDailyMaxKillsLR1;
			Quest.repeatableQuests[2].questConfig.Elimination[1].minKills = ScavDaily.ScavDailyMinKillsLR2;
			Quest.repeatableQuests[2].questConfig.Elimination[1].maxKills = ScavDaily.ScavDailyMaxKillsLR2;
		}

		//############## SCAV SECTION ############## I wish i never made one, but here we are
		if (Config.Scav.EnableScav)
			{
				Inraid.carExtractBaseStandingGain = Config.Scav.CarBaseStanding
				locations["laboratory"].base.DisabledForScav = !Config.Scav.ScavLab;
				//Scav Cooldown Timer
				globals.SavagePlayCooldown = Config.Scav.ScavTimer;
				/*if (Config.Raids.UnlockPMCExitsForScav) Proven to be not functional, big sadde
				{
					for (let map in locations)
					{
						switch (map)
						{
								case "base":
								break;
							default:
							Logger.info(locations[map].base.DisabledScavExits)
							locations[map].base.exits.DisabledScavExits = "";
							break;
						}
					}
				}*/
				//PMC kill rep
				Bot["bear"].experience.standingForKill = Config.Scav.StandingPMCKill;
				Bot["usec"].experience.standingForKill = Config.Scav.StandingPMCKill;
					//Scav kill rep
				Bot["assault"].experience.standingForKill = Config.Scav.StandingFriendlyKill;
				Bot["cursedassault"].experience.standingForKill = Config.Scav.StandingFriendlyKill;
				Bot["marksman"].experience.standingForKill = Config.Scav.StandingFriendlyKill;

				for (let levels in globals.FenceSettings.Levels)//Damn it looks counter intuitive
				{
					if (Config.Scav.HostileScavs)
					{
						globals.FenceSettings.Levels[levels].HostileScavs = Config.Scav.HostileScavs
					}
					if (Config.Scav.HostileBosses)
					{
						globals.FenceSettings.Levels[levels].HostileBosses = Config.Scav.HostileScavs
					}
					if(Config.Scav.FriendlyScavs)
					{
						globals.FenceSettings.Levels[levels].HostileScavs = !Config.Scav.FriendlyScavs
					}
					if(Config.Scav.FriendlyBosses)
					{
						globals.FenceSettings.Levels[levels].HostileBosses = !Config.Scav.FriendlyBosses
					}
				}
				if (Config.Scav.ScavCustomPockets)
				{
					const JsonUtil = container.resolve("JsonUtil");
					let ScavCustomPocketItem = JsonUtil.clone(items["557ffd194bdc2d28148b457f"])
					let ScavPocketSize = Config.Scav.SCAVPockets
					ScavCustomPocketItem._id = "ScavCustomPocket"
					ScavCustomPocketItem._props.Grids[0]._id = "SVMScavPocket1"
					ScavCustomPocketItem._props.Grids[0]._parent = "ScavCustomPocket"
					ScavCustomPocketItem._props.Grids[0]._props.cellsH = ScavPocketSize.ScavFirstH
					ScavCustomPocketItem._props.Grids[0]._props.cellsV = ScavPocketSize.ScavFirstV
					ScavCustomPocketItem._props.Grids[1]._id = "SVMScavPSocket2"
					ScavCustomPocketItem._props.Grids[1]._parent = "ScavCustomPocket"
					ScavCustomPocketItem._props.Grids[1]._props.cellsH = ScavPocketSize.ScavSecondH
					ScavCustomPocketItem._props.Grids[1]._props.cellsV = ScavPocketSize.ScavSecondV
					ScavCustomPocketItem._props.Grids[2]._id = "SVMScavPocket3"
					ScavCustomPocketItem._props.Grids[2]._parent = "ScavCustomPocket"
					ScavCustomPocketItem._props.Grids[2]._props.cellsH = ScavPocketSize.ScavThirdH
					ScavCustomPocketItem._props.Grids[2]._props.cellsV = ScavPocketSize.ScavThirdV
					ScavCustomPocketItem._props.Grids[3]._id = "SVMScavPocket4"
					ScavCustomPocketItem._props.Grids[3]._parent = "ScavCustomPocket"
					ScavCustomPocketItem._props.Grids[3]._props.cellsH = ScavPocketSize.ScavFourthH
					ScavCustomPocketItem._props.Grids[3]._props.cellsV = ScavPocketSize.ScavFourthV
					if (ScavPocketSize.ScavFourthH == 0 || ScavPocketSize.ScavFourthV == 0)
					{
						ScavCustomPocketItem._props.Grids.splice(3,1);
					}
					if (ScavPocketSize.ScavThirdH == 0 || ScavPocketSize.ScavThirdV == 0)
					{
						ScavCustomPocketItem._props.Grids.splice(2,1);
					}
					if (ScavPocketSize.ScavSecondH == 0 || ScavPocketSize.ScavSecondV == 0)
					{
						ScavCustomPocketItem._props.Grids.splice(1,1);
					}
					if (ScavPocketSize.ScavFirstH == 0 || ScavPocketSize.ScavFirstV == 0)
					{
						ScavCustomPocketItem._props.Grids.splice(0,1);
					}
					items["ScavCustomPocket"] = ScavCustomPocketItem;
				}
			}
		//############## FUNCTIONS ##############
		//Set a Unique AI type spawn within selected location, with a lot of variables to come in.
		function CreateBoss(role, chance, followers, escortAmount, zones)
		{
			return {
				"BossName": role,
				"BossChance": chance,
				"BossZone": zones,
				"BossPlayer": false,
				"BossDifficult": "normal",
				"BossEscortType": followers,
				"BossEscortDifficult": "normal",
				"BossEscortAmount": escortAmount,
				"Time": -1
			}
		}
		function Filter(value)
		{
			let test = value.substring(1, value.length - 1)
			let arrayfin = test.split(",")
			return arrayfin
		}
		function EditSimpleItemData(id, data, value)
		{
			if (isNaN(value) && value !== 'true' && value !== 'false')
			{
				items[id]._props[data] = value
			}
			else
			{
				items[id]._props[data] = JSON.parse(value)
			}
		}
		function isJSONValueDefined(value) 
		{
			return value !== undefined && !value.isNaN;
		}
		function FreeExit(Exit)
		{
			Exit.PassageRequirement = "None";
			Exit.ExfiltrationType = "Individual";
			Exit.Id = '';
			Exit.Count = 0;
			Exit.PlayersCount = 0;
			Exit.RequirementTip = '';
			if (Exit.RequiredSlot)
			{
				delete Exit.RequiredSlot;
			}
		}
		function AmmoFilter(AID,Comp)
		{
			for (let ID in AID)
			{
				if(Comp.includes(AID[ID]))
				{
					return true;
				}
			}
			return false;
		}
	}
}
module.exports = {
	mod: new MainSVM
};