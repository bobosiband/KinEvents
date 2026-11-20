describe('SharedListsStore', () => {
  it('createList then addItem is reflected in itemsForList', async () => {
    jest.resetModules()
    const { sharedListsStore } = await import('../src/services/sharedListsStore')
    sharedListsStore.resetForTesting()
    const list = sharedListsStore.createList({ eventId: 'e1', title: 'Potluck', createdBy: 'u1' })
    const item = sharedListsStore.addItem({ listId: list.id, name: 'Salad', quantity: 2 })
    expect(item).not.toBeNull()
    expect(sharedListsStore.itemsForList(list.id)).toHaveLength(1)
  })

  it('claim is first-come-first-served', async () => {
    jest.resetModules()
    const { sharedListsStore } = await import('../src/services/sharedListsStore')
    sharedListsStore.resetForTesting()
    const list = sharedListsStore.createList({ eventId: 'e1', title: 'Potluck', createdBy: 'u1' })
    const item = sharedListsStore.addItem({ listId: list.id, name: 'Salad' })!
    const first = sharedListsStore.claim(item.id, 'alice')
    const second = sharedListsStore.claim(item.id, 'bob')
    expect(first?.claimedBy).toBe('alice')
    expect(second).toBeNull()
  })

  it('release only works for the claimant', async () => {
    jest.resetModules()
    const { sharedListsStore } = await import('../src/services/sharedListsStore')
    sharedListsStore.resetForTesting()
    const list = sharedListsStore.createList({ eventId: 'e1', title: 'Potluck', createdBy: 'u1' })
    const item = sharedListsStore.addItem({ listId: list.id, name: 'Salad' })!
    sharedListsStore.claim(item.id, 'alice')
    expect(sharedListsStore.release(item.id, 'bob')).toBeNull()
    const released = sharedListsStore.release(item.id, 'alice')
    expect(released?.claimedBy).toBeUndefined()
  })
})
