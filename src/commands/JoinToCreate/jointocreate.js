import discord
from discord.ext import commands
from flask import Flask, request
, threading

# Initialize Discord Bot
intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_command_prefix="!", intents=intents)

# Target guild (server) ID where channels will be created
GUILD_ID = 123456789012345678  # Replace with your Server ID

# 1. Trigger via Discord Command
@bot.tree.command(name="createchannel", description="Creates a new text channel")
async def create_channel_cmd(interaction: discord.Interaction, channel_name: str):
    guild = interaction.guild
    # Check permissions
    if not interaction.user.guild_permissions.manage_channels:
        await interaction.response.send_message("You don't have permission to manage channels.", ephemeral=True)
        return
        
    new_channel = await guild.create_text_channel(name=channel_name)
    await interaction.response.send_message(f"✅ Text channel {new_channel.mention} successfully created!")

# 2. Optional: Trigger via GitHub Webhook Web Server
flask_app = Flask(__name__)

@flask_app.route('/webhook', methods=['POST'])
def github_webhook():
    data = request.json
    # Check if a new repository was created on GitHub
    if data and 'repository' in data and data.get('action') == 'created':
        repo_name = data['repository']['name']
        
        # Schedule the channel creation inside the Discord running loop
        bot.loop.create_task(create_github_channel(f"repo-{repo_name}"))
    return {}, 200

async def create_github_channel(channel_name):
    guild = bot.get_guild(GUILD_ID)
    if guild:
        new_channel = await guild.create_text_channel(name=channel_name)
        # Find a default or system channel to announce it
        for channel in guild.text_channels:
            if channel.permissions_for(guild.me).send_messages:
                await channel.send(f"🚀 New GitHub repository detected! Channel {new_channel.mention} created.")
                break

def run_flask():
    flask_app.run(port=5000)

@bot.event
async def on_ready():
    print(f'Bot is online as {bot.user}')
    # Sync slash commands
    try:
        synced = await bot.tree.sync()
        print(f"Synced {len(synced)} command(s)")
    except Exception as e:
        print(e)

# Start Flask in a background thread so it doesn't block the Discord bot
threading.Thread(target=run_flask, daemon=True).start()

# Run the bot (Replace with your actual Discord Token)
bot.run('YOUR_DISCORD_BOT_TOKEN')
