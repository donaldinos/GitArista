#!/usr/local/bin/node

var sys = require('sys'),
    irc = require('irc'),
     fs = require('fs'),
   exec = require('child_process').exec;
var MINUTES_UNTIL_NEXT_UPDATE = 1,
    CHANNEL = '#yourchannel',
    IRC_SERVER = 'irc.freenode.net',
    IRC_NICK = 'gitarista'
    GIT_REPO = '/home/git/yourrepo.git', 
    WELCOMEMSG1 = '\u0002Hi, my name is GitArtist (git announcer 1. generation) and i would you inform about changes in your GIT repository ' + GIT_REPO + '\u000f';
    WELCOMEMSG2 = '\u0002I am powered by NodeJS ! Update interval is set to ' + MINUTES_UNTIL_NEXT_UPDATE + ' min. !\u000f';
var git_actual = git_last = '';

process.chdir(GIT_REPO);

process.addListener('uncaughtException', function (err) {
  console.log('uncaught exception: ' + err);
});

var bot = new irc.Client(IRC_SERVER, IRC_NICK, {
    debug: false,
    channels: [CHANNEL]
});

bot.addListener('error', function(message) {
    console.log('ERROR: ' + message.command + ': ' + message.args.join(' '));
});

bot.addListener('names', function(message) {
    console.log('Connected !');
    // Start the stuff.
    bot.say(CHANNEL, WELCOMEMSG1);
    bot.say(CHANNEL, WELCOMEMSG2);
    checkGIT();
});

bot.addListener('message', function (from, to, message) {
     //sys.puts(from + ' => ' + to + ': ' + message);

    if ( to.match(/^[#&]/) ) {
        // channel message
         if ( message.match(/gitarista: last/) ) {
            show_msg();
	   }
	}
 });

function show_msg(){
	exec('git log -1 --pretty=format:"The author of last commit %h was %an, %aD. Commit message: "', function (err, stdout, stderr) {
		if (err) {
			console.log("error!: " + err.code);
			console.log("stdout: " + JSON.stringify(stdout));
			console.log("stderr: " + JSON.stringify(stderr));
		} else {
	       exec('git log -1 --pretty=format:%s', function (err, stdout_msg, stderr_msg) {
	        	if (err) {
	    			console.log("error!: " + err.code);
	    			console.log("stdout: " + JSON.stringify(stdout_msg));
	    			console.log("stderr: " + JSON.stringify(stderr_msg));
	    		} else {
	    			console.log(JSON.stringify(stdout));
        			bot.say(CHANNEL, '\u0002Git:\u000f ' + stdout + '\u0002' + stdout_msg + '\u000f');
				}
		   });
		}
	});
}

function get_changes(){
	if(git_last == git_actual) {
	    msg = 'Already actual version ' + git_actual;	
	//    console.log(msg);
	} else { 
        console.log('git_last = ' + git_last + ' | git_actual = ' + git_actual);
    	show_msg();
    }        
}

function get_actual_git(){
    exec('git log -1 --pretty=format:"%h"', function (err, stdout, stderr) {
      if (err) {
        console.log("error!: " + err.code);
        console.log("stdout: " + JSON.stringify(stdout));
        console.log("stderr: " + JSON.stringify(stderr));
        return '';
      } else {
        git_actual = stdout;
        
        fs.readFile(__dirname + '/git_irc.log', function(err, val) {
        	if (err) {
        	   console.log(err.stack);
        	   return '';
        	} else {
               git_last = val;
        	   
	           fs.writeFile(__dirname + '/git_irc.log', git_actual, function(err) {
                   if(err) {
                     console.error(err.stack);
               	  return;
               	} else {
//               	  console.log('Saved!');
               	  get_changes();
               	}
       	    });       
        	}
        });	
      }
    });
}

// Git section.
function checkGIT() {
    get_actual_git();
    
    //console.log('next update in', MINUTES_UNTIL_NEXT_UPDATE, 'minutes');
    setTimeout(checkGIT, MINUTES_UNTIL_NEXT_UPDATE * 60000);
}

