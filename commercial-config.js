// Leave unconfirmed business information unset. Nothing is advertised from null values.
window.PepeNeroCommercial = Object.freeze({
  order: {
    // Advertise only entries explicitly confirmed by the restaurant.
    // modes: [{ id: 'delivery' | 'pickup', confirmed: true }]
    modes: [],
    // paymentMethods: [{ id: 'cash' | 'pix' | 'credit' | 'debit', label: '...', confirmed: true }]
    paymentMethods: [],
    // Delivery area and fee are independent confirmations. null fee is NOT free delivery.
    // areas: [{ city: '...', neighborhood: '...', feeCents: 0 | positive integer | null }]
    delivery: { confirmed: false, areas: [] }
  },
  eveningForTwo: null
  // After restaurant approval only:
  // { approved: true, starter: '<existing product id>', sharedDish: '<existing product id>', dessert: '<existing product id>' }
  // Regular item prices are used, never a package price or discount.
});
