const NETWORK_ID = 5

const CAFE_TOKEN_ADDRESS = "0x5e63799Ea51fF3eD5D13155c43f05dDeb5e6f1C9"
const CAFE_TOKEN_PRESALE_ADDRESS = "0xBe46Cc2327462d3a357629f8427a94778fD1DD52"
const CTUSD_ADDRESS = "0x2aD1AB43436502Ea6693F1509170d11065669cdf"
const CAFE_TOKEN_ABI_PATH = "./json_abi/CafeToken.json"
const CAFE_TOKEN_PRESALE_ABI_PATH = "./json_abi/CafeTokenPresale.json"
const CTUSD_ABI_PATH = "./json_abi/CTUSD.json"

var cafe_token_contract
var cafe_token_presale_contract
var ctusd_contract

var accounts
var web3

function metamaskReloadCallback() {
  window.ethereum.on('accountsChanged', (accounts) => {
    document.getElementById("web3_message").textContent="Se cambió el account, refrescando...";
    window.location.reload()
  })
  window.ethereum.on('networkChanged', (accounts) => {
    document.getElementById("web3_message").textContent="Se el network, refrescando...";
    window.location.reload()
  })
}

const getWeb3 = async () => {
  return new Promise((resolve, reject) => {
    if(document.readyState=="complete")
    {
      if (window.ethereum) {
        const web3 = new Web3(window.ethereum)
        window.location.reload()
        resolve(web3)
      } else {
        reject("must install MetaMask")
        document.getElementById("web3_message").textContent="Error: Porfavor conéctate a Metamask";
      }
    }else
    {
      window.addEventListener("load", async () => {
        if (window.ethereum) {
          const web3 = new Web3(window.ethereum)
          resolve(web3)
        } else {
          reject("must install MetaMask")
          document.getElementById("web3_message").textContent="Error: Please install Metamask";
        }
      });
    }
  });
};

const getContract = async (web3, address, abi_path) => {
  const response = await fetch(abi_path);
  const data = await response.json();
  
  const netId = await web3.eth.net.getId();
  contract = new web3.eth.Contract(
    data,
    address
    );
  return contract
}

async function loadDapp() {
  metamaskReloadCallback()
  document.getElementById("web3_message").textContent="Please connect to Metamask"
  var awaitWeb3 = async function () {
    web3 = await getWeb3()
    web3.eth.net.getId((err, netId) => {
      if (netId == NETWORK_ID) {
        var awaitContract = async function () {
          cafe_token_contract = await getContract(web3, CAFE_TOKEN_ADDRESS, CAFE_TOKEN_ABI_PATH)
          cafe_token_presale_contract = await getContract(web3, CAFE_TOKEN_PRESALE_ADDRESS, CAFE_TOKEN_PRESALE_ABI_PATH)
          ctusd_contract = await getContract(web3, CTUSD_ADDRESS, CTUSD_ABI_PATH)
          document.getElementById("web3_message").textContent="You are connected to Metamask"
          onContractInitCallback()
          web3.eth.getAccounts(function(err, _accounts){
            accounts = _accounts
            if (err != null)
            {
              console.error("An error occurred: "+err)
            } else if (accounts.length > 0)
            {
              onWalletConnectedCallback()
              document.getElementById("account_address").style.display = "block"
            } else
            {
              document.getElementById("connect_button").style.display = "block"
            }
          });
        };
        awaitContract();
      } else {
        document.getElementById("web3_message").textContent="Please connect to Goerli";
      }
    });
  };
  awaitWeb3();
}

async function connectWallet() {
  await window.ethereum.request({ method: "eth_requestAccounts" })
  accounts = await web3.eth.getAccounts()
  onWalletConnectedCallback()
}

loadDapp()

const onContractInitCallback = async () => {
  var priceA = await cafe_token_presale_contract.methods.tokenPrices(0).call()
  var priceB = await cafe_token_presale_contract.methods.tokenPrices(1).call()
  var amountToken0 = await cafe_token_contract.methods.balanceOf(accounts[0], 0).call()
  var amountToken1 = await cafe_token_contract.methods.balanceOf(accounts[0], 1).call()
  var amountCTUSD = await ctusd_contract.methods.balanceOf(accounts[0]).call()
  var token0InPresale = await cafe_token_contract.methods.balanceOf(CAFE_TOKEN_PRESALE_ADDRESS, 0).call()
  var token1InPresale = await cafe_token_contract.methods.balanceOf(CAFE_TOKEN_PRESALE_ADDRESS, 1).call()

  var contract_state = "TokenA Price: " + web3.utils.fromWei(priceA) + "CTUSD"
    + ", TokenB Price: " + web3.utils.fromWei(priceB) + "CTUSD"
    + ", You have: " + amountToken0 + "TA, " + amountToken1 + "TB, " + web3.utils.fromWei(amountCTUSD) + "TUSD"
    + ", Tokens in presale: " + token0InPresale + "TA, " + token1InPresale + "TB"
  
  document.getElementById("contract_state").textContent = contract_state;
}

const onWalletConnectedCallback = async () => {
}


//// Functions ////

const buy = async (id, amount) => {
  const result = await cafe_token_presale_contract.methods.buy(id, amount)
  .send({ from: accounts[0], gas: 0, value: 0 })
  .on('transactionHash', function(hash){
    document.getElementById("web3_message").textContent="Executing...";
  })
  .on('receipt', function(receipt){
    document.getElementById("web3_message").textContent="Success.";    })
  .catch((revertReason) => {
    console.log("ERROR! Transaction reverted: " + revertReason.receipt.transactionHash)
  });
}

const approve = async (tokenId, amount) => {
  price = await cafe_token_presale_contract.methods.tokenPrices(tokenId).call()
  total_approve = "" + (amount*price)
  const result = await ctusd_contract.methods.approve(CAFE_TOKEN_PRESALE_ADDRESS, total_approve)
  .send({ from: accounts[0], gas: 0, value: 0 })
  .on('transactionHash', function(hash){
    document.getElementById("web3_message").textContent="Executing...";
  })
  .on('receipt', function(receipt){
    document.getElementById("web3_message").textContent="Success.";    })
  .catch((revertReason) => {
    console.log("ERROR! Transaction reverted: " + revertReason.receipt.transactionHash)
  });
}