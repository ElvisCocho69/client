import { isPermission } from './constants'

export const canViewNavLink = (item) => {
    // Si no tiene requerimiento de permiso, se muestra
    if (!item.meta?.requiresPermission) return true
    
    // Si tiene requerimiento de permiso, verificar
    return isPermission(item.meta.requiresPermission)
}

export const canViewNavGroup = (item) => {
    // Si el grupo no tiene requerimiento de permiso propio
    if (!item.meta?.requiresPermission) {
        // Verificar si al menos un hijo es visible
        return item.children.some(child => {
            if ('children' in child) {
                return canViewNavGroup(child)
            }
            return canViewNavLink(child)
        })
    }
    
    // Si el grupo tiene requerimiento de permiso, verificar el permiso y los hijos
    return isPermission(item.meta.requiresPermission) && item.children.some(child => {
        if ('children' in child) {
            return canViewNavGroup(child)
        }
        return canViewNavLink(child)
    })
}

export const canViewNavHeading = (item, navItems) => {
    // Encontrar el índice del heading actual
    const headingIndex = navItems.findIndex(navItem => navItem === item)
    
    // Si no encontramos el heading o es el último elemento, no mostrarlo
    if (headingIndex === -1 || headingIndex === navItems.length - 1) return false
    
    // Buscar los elementos que siguen hasta el próximo heading o el final
    let nextIndex = headingIndex + 1
    const itemsInSection = []
    
    while (nextIndex < navItems.length && !('heading' in navItems[nextIndex])) {
        itemsInSection.push(navItems[nextIndex])
        nextIndex++
    }
    
    // Verificar si al menos un elemento en la sección es visible
    return itemsInSection.some(sectionItem => {
        if ('children' in sectionItem) {
            return canViewNavGroup(sectionItem)
        }
        return canViewNavLink(sectionItem)
    })
} 