describe('LedgerStore', () => {
  it('post() appends an entry and never mutates prior ones', async () => {
    jest.resetModules()
    const { ledgerStore } = await import('../src/services/ledgerStore')
    ledgerStore.resetForTesting()
    const first = ledgerStore.post({
      entryType: 'contribution', amountCents: 10000, currency: 'ZAR',
      memo: 'Alice contributes', postedBy: 'u1', payerId: 'u1', giftPoolId: 'g1',
    })
    const second = ledgerStore.post({
      entryType: 'adjustment', amountCents: -10000, currency: 'ZAR',
      memo: 'Correction', postedBy: 'u-admin', reversesEntryId: first.id,
    })
    const all = ledgerStore.listAll()
    expect(all).toHaveLength(2)
    expect(all[0]).toEqual(first)
    expect(second.reversesEntryId).toBe(first.id)
    expect(second.amountCents).toBe(-10000)
  })

  it('listForUser scopes entries to payer or payee', async () => {
    jest.resetModules()
    const { ledgerStore } = await import('../src/services/ledgerStore')
    ledgerStore.resetForTesting()
    ledgerStore.post({ entryType: 'contribution', amountCents: 500, currency: 'ZAR', memo: 'a', postedBy: 'u1', payerId: 'u1' })
    ledgerStore.post({ entryType: 'contribution', amountCents: 500, currency: 'ZAR', memo: 'b', postedBy: 'u2', payerId: 'u2' })
    expect(ledgerStore.listForUser('u1')).toHaveLength(1)
    expect(ledgerStore.listForUser('u2')).toHaveLength(1)
    expect(ledgerStore.listAll()).toHaveLength(2)
  })
})
