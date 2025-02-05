import chalk from 'chalk';

// Header ASCII Art and Info
const printHeader = () => {
    console.clear(); // Clears the console before printing
    console.log(chalk.cyanBright(`
╔═════════════════════════════════════════════════╗
║                                                 
║  ██████╗ ██╗███╗   ██╗███████╗████████╗███████╗ 
║  ██╔══██╗██║████╗  ██║██╔════╝╚══██╔══╝██╔════╝
║  ██████╔╝██║██╔██╗ ██║█████╗     ██║   █████╗   
║  ██╔═══╝ ██║██║╚██╗██║██╔══╝     ██║   ██╔══╝   
║  ██║     ██║██║ ╚████║███████╗   ██║   ███████╗ 
║  ╚═╝     ╚═╝╚═╝  ╚═══╝╚══════╝   ╚═╝   ╚══════╝ 
║                                                 
║  🚀 ${chalk.bold.yellow("SUPER BIANZZZ")}       
║  🔥 AUTO SCRIPT MASTER                          
║                                               
║  📢 JOIN TELEGRAM CHANNEL NOW!                  
║     https://t.me/superbianz  
║     @SuperBianzZz - OFFICIAL CHANNEL   
║                                                 
║  ⚡ FAST - RELIABLE - SECURE   
║  🛠  SCRIPTS EXPERT                              
║                                                 
╚═════════════════════════════════════════════════╝
`));
};

export default printHeader;

