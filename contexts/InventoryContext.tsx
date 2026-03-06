import {createEmptyEquippedItems} from '@/constants/items'
import {EquippedItems, InventoryItem, ItemStats} from '@/types/game'
import {calculateEquipmentBonuses} from '@/utils/calculations'
import React, {createContext, ReactNode, useContext, useMemo, useState} from 'react'

const createTestInventory = (): InventoryItem[] => [
  {instanceId: 'test-1', definitionId: 'rusty_sword'},
  {instanceId: 'test-2', definitionId: 'leather_cap'},
  {instanceId: 'test-3', definitionId: 'cloth_tunic'},
  {instanceId: 'test-4', definitionId: 'wooden_shield'},
  {instanceId: 'test-5', definitionId: 'leather_boots'},
  {instanceId: 'test-6', definitionId: 'copper_ring'},
  {instanceId: 'test-7', definitionId: 'bone_amulet'},
  {instanceId: 'test-8', definitionId: 'cloth_gloves'},
  {instanceId: 'test-9', definitionId: 'steel_blade'},
  {instanceId: 'test-10', definitionId: 'iron_helm'},
  {instanceId: 'test-11', definitionId: 'chainmail'},
  {instanceId: 'test-12', definitionId: 'iron_shield'},
  {instanceId: 'test-13', definitionId: 'doom_blade'},
  {instanceId: 'test-14', definitionId: 'crown_of_kings'},
  {instanceId: 'test-15', definitionId: 'swift_boots'}
]

interface InventoryContextType {
  equipped: EquippedItems
  inventory: InventoryItem[]
  equipmentBonuses: ItemStats
  setEquipped: React.Dispatch<React.SetStateAction<EquippedItems>>
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>
}

const InventoryContext = createContext<InventoryContextType | null>(null)

export function InventoryProvider({children}: {children: ReactNode}) {
  const [equipped, setEquipped] = useState<EquippedItems>(createEmptyEquippedItems)
  const [inventory, setInventory] = useState<InventoryItem[]>(createTestInventory)

  const equipmentBonuses = useMemo(() => calculateEquipmentBonuses(equipped), [equipped])

  return (
    <InventoryContext.Provider value={{equipped, inventory, equipmentBonuses, setEquipped, setInventory}}>
      {children}
    </InventoryContext.Provider>
  )
}

export function useInventory() {
  const context = useContext(InventoryContext)
  if (!context) throw new Error('useInventory must be used within InventoryProvider')
  return context
}
