
// frontend -->> websocket server

// only dashboard subscribe
let dashboard = {
  type : "subscribe",
  channels : [
    {
      name : "dashboard",
      product_ids : [
        {
          name : "COIN",
          ask_market : [],
          bid_market : []
        }
      ],
    }
  ]
}

// dashboard && market_status subscribe
let dashboard = {
  type : "subscribe",
  channels : [
    {
      name : "dashboard",
      product_ids : [
        {
          name : "COIN",
          ask_market : [],
          bid_market : []
        }
      ],
    },
    {
      name : "market_status"
    }
  ]
}

let orderbook = {
  type : "subscribe",
  channel : [
    {
      name : "orderbook",
      product_ids : [
        {
          name : "COIN",
          ask_market : [],
          bid_market : []
        }
      ]
    }
  ]
}

// subscribe message 수신 후 해당 market list로 redis table 한번 만 make 하여 저장.
