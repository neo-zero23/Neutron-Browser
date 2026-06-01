(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (root) root.NeutronI18n = api;
})(typeof self !== 'undefined' ? self : this, function () {
  const STRINGS = {
    es: {
      main: {
        back: 'Atrás',
        forward: 'Adelante',
        reload: 'Recargar',
        copy: 'Copiar',
        paste: 'Pegar',
        selectAll: 'Seleccionar todo',
        saveImageAs: 'Guardar imagen como...',
        saveLinkAs: 'Guardar enlace como...',
        inspectElement: 'Inspeccionar elemento'
      },
      chrome: {
        title: 'Neutron Browser',
        brand: 'Neutron',
        atomicMode: 'ATOMIC MODE',
        defaultProfile: 'Default',
        guestProfile: 'Invitado',
        customBrowsing: 'Navegación personalizada',
        newTab: 'Nueva pestaña',
        closeTab: 'Cerrar pestaña',
        duplicateTab: 'Duplicar pestaña',
        pinTab: 'Fijar pestaña',
        unpinTab: 'Desfijar pestaña',
        closeOtherTabs: 'Cerrar otras pestañas',
        pinnedTab: 'Pestaña fijada',
        back: 'Atrás',
        forward: 'Adelante',
        reload: 'Recargar',
        home: 'Inicio',
        settings: 'Configuración',
        history: 'Historial',
        favorites: 'Favoritos',
        addToFavorites: 'Añadir a favoritos',
        addToSidebar: 'Añadir a Sidebar',
        addToHome: 'Añadir a Inicio',
        changeProfile: 'Cambiar perfil',
        newProfile: '+ Nuevo perfil',
        newProfileTitle: 'Nuevo perfil',
        newProfileName: 'Nombre del perfil',
        guestMode: 'Modo Invitado',
        cancel: 'Cancelar',
        create: 'Crear',
        deleteProfile: 'Eliminar perfil',
        removeBookmark: 'Eliminar marcador',
        welcome: 'Bienvenido a Neutron',
        chooseProfile: 'Elige un perfil para empezar',
        urlPlaceholder: 'Busca en Google o ingresa una URL...',
        go: 'GO',
        minimize: 'Minimizar',
        maximize: 'Maximizar',
        closeWindow: 'Cerrar',
        ramMeter: 'Uso de RAM de Neutron',
        shield: 'Protecciones',
        downloads: 'Descargas',
        panic: 'Botón de Pánico',
        clearCache: 'Limpiar Caché y RAM',
        showSidebar: 'Ocultar/Mostrar barra lateral',
        tabTitleDefault: 'Nueva pestaña'
      },
      home: {
        title: 'Neutron',
        searchPlaceholder: 'Buscar o escribir URL...',
        searchButton: 'Buscar',
        caption: 'UN NAVEGADOR PARA TODOS',
        brand: 'NEUTRON'
      },
      settings: {
        title: 'Configuración',
        header: 'Configuración',
        version: 'Neutron Browser v2.0.0',
        tabs: ['General', 'Búsqueda', 'Privacidad', 'Escudo', 'Apariencia', 'Personalización', 'Rendimiento'],
        general: [
          ['Hibernación Inteligente', 'Suspende pestañas inactivas en segundo plano'],
          ['Bloqueo de Telemetría', 'Inhabilita rastreadores y métricas de Chromium']
        ],
        search: ['Motor de Búsqueda', 'Elige el motor para la barra de direcciones'],
        privacy: [
          ['Do Not Track (DNT)', 'Envía cabecera DNT en todas las peticiones'],
          ['Borrar Cookies al Salir', 'Elimina todas las cookies al cerrar el navegador'],
          ['Borrar Caché al Salir', 'Limpia la caché al cerrar el navegador']
        ],
        shield: [
          ['Bloquear Anuncios', 'Bloquea dominios de publicidad conocidos'],
          ['Bloquear Rastreadores', 'Bloquea dominios de tracking y analytics'],
          ['Bloquear Telemetría', 'Bloquea dominios de telemetría de navegador/OS'],
          ['Dominios Bloqueados', 'Lista personalizada de dominios bloqueados'],
          ['Peticiones Bloqueadas', '']
        ],
        themeOptions: ['Oscuro', 'Claro', 'Automático'],
        appearance: [
          ['Tema de Interfaz', 'Oscuro / Claro para el navegador'],
          ['Modo Oscuro Forzado', 'Fuerza tema oscuro en todos los sitios web'],
          ['Pestañas Verticales', 'Ubica las pestañas en una barra lateral vertical'],
          ['Color de Acento', 'Color principal del navegador'],
          ['Densidad de Interfaz', 'Ajusta el espaciado de la barra y pestañas']
        ],
        customize: [
          ['Botón de Inicio', 'Muestra el botón Inicio en la barra de navegación'],
          ['Barra Lateral', 'Muestra la barra de accesos directos'],
          ['Idiomas', 'Cambia el idioma de toda la interfaz'],
          ['Fondo de Inicio', 'Imagen personalizada como fondo de nueva pestaña'],
          ['Sincronización Local', 'Exporta o importa config, perfiles, marcadores e historial']
        ],
        sync: {
          title: 'Sincronización Local',
          description: 'Guarda o restaura tus datos de Neutron en un archivo JSON',
          export: 'Exportar datos',
          import: 'Importar datos',
          exported: 'Exportación completada',
          imported: 'Importación completada',
          cancelled: 'Operación cancelada',
          failed: 'Error de sincronización'
        },
        shieldBlockCurrentSite: 'Bloquear sitio actual',
        performance: [
          ['Desactivar WebRTC', 'Previene fugas de IP local (vital para VPNs)'],
          ['Desactivar Aceleración HW', 'Para hardware antiguo o problemas de drivers'],
          ['Ahorro de Energía', 'Reduce FPS a 30, acelera hibernación y desactiva efectos visuales'],
          ['Restauración de Sesión', 'Reabre las pestañas al iniciar Neutron']
        ],
        restartBadge: 'REQUIERE REINICIO',
        restartPrompt: 'Este cambio requiere reiniciar Neutron. ¿Continuar?',
        addDomain: '+ Añadir',
        domainPlaceholder: 'ej: evil-tracker.com',
        select: 'Seleccionar',
        clear: '✕',
        purge: 'PURGAR MEMORIA',
        purging: 'PURGANDO...',
        noImage: 'Ninguna imagen seleccionada',
        statsBefore: 'Antes',
        statsAfter: 'Después',
        statsFreed: 'Liberado',
        statsPartitions: 'Particiones',
        statsActiveTabs: 'Tabs activos',
        before: 'Antes',
        after: 'Después',
        freed: 'Liberado',
        partitions: 'Particiones',
        activeTabs: 'Tabs activos',
        v8: 'Motor V8',
        calculating: 'Calculando...',
        languageOptionEs: 'Español',
        languageOptionEn: 'English',
        languageOptionPt: 'Português',
        languageOptionFr: 'Français'
      },
      history: {
        clearAll: 'Borrar todo',
        close: 'Cerrar',
        empty: 'Sin historial de navegación',
        delete: 'Eliminar',
        visits: 'visitas'
      },
      favorites: {
        close: 'Cerrar',
        empty: 'Sin favoritos guardados',
        remove: 'Eliminar favorito'
      },
      downloads: {
        close: 'Cerrar',
        empty: 'Sin descargas activas',
        cancel: 'Cancelar',
        complete: 'Completado',
        error: 'Error',
        pause: 'Pausar',
        resume: 'Reanudar',
        openFolder: 'Abrir carpeta'
      },
      onboarding: {
        title: 'Bienvenido a Neutron',
        subtitle: 'Navegador rápido, privado y optimizado',
        selectLanguage: 'Selecciona tu idioma',
        selectTheme: 'Elige tu tema',
        darkTheme: 'Oscuro',
        lightTheme: 'Claro',
        autoTheme: 'Automático',
        start: 'Comenzar',
        canChangeAnytime: 'Puedes cambiar esto después en configuración'
      }
    },
    en: {
      main: {
        back: 'Back',
        forward: 'Forward',
        reload: 'Reload',
        copy: 'Copy',
        paste: 'Paste',
        selectAll: 'Select all',
        saveImageAs: 'Save image as...',
        saveLinkAs: 'Save link as...',
        inspectElement: 'Inspect element'
      },
      chrome: {
        title: 'Neutron Browser',
        brand: 'Neutron',
        atomicMode: 'ATOMIC MODE',
        defaultProfile: 'Default',
        guestProfile: 'Guest',
        customBrowsing: 'Custom browsing',
        newTab: 'New tab',
        closeTab: 'Close tab',
        duplicateTab: 'Duplicate tab',
        pinTab: 'Pin tab',
        unpinTab: 'Unpin tab',
        closeOtherTabs: 'Close other tabs',
        pinnedTab: 'Pinned tab',
        back: 'Back',
        forward: 'Forward',
        reload: 'Reload',
        home: 'Home',
        settings: 'Settings',
        history: 'History',
        favorites: 'Favorites',
        addToFavorites: 'Add to favorites',
        addToSidebar: 'Add to Sidebar',
        addToHome: 'Add to Home',
        changeProfile: 'Change profile',
        newProfile: '+ New profile',
        newProfileTitle: 'New profile',
        newProfileName: 'Profile name',
        guestMode: 'Guest mode',
        cancel: 'Cancel',
        create: 'Create',
        deleteProfile: 'Delete profile',
        removeBookmark: 'Remove bookmark',
        welcome: 'Welcome to Neutron',
        chooseProfile: 'Choose a profile to start',
        urlPlaceholder: 'Search Google or enter a URL...',
        go: 'GO',
        minimize: 'Minimize',
        maximize: 'Maximize',
        closeWindow: 'Close',
        ramMeter: 'Neutron RAM usage',
        shield: 'Protections',
        downloads: 'Downloads',
        panic: 'Panic button',
        clearCache: 'Clear Cache and RAM',
        showSidebar: 'Show/Hide sidebar',
        tabTitleDefault: 'New tab'
      },
      home: {
        title: 'Neutron',
        searchPlaceholder: 'Search or type URL...',
        searchButton: 'Search',
        caption: 'A BROWSER FOR EVERYONE',
        brand: 'NEUTRON'
      },
      settings: {
        title: 'Settings',
        header: 'Settings',
        version: 'Neutron Browser v2.0.0',
        tabs: ['General', 'Search', 'Privacy', 'Shield', 'Appearance', 'Customize', 'Performance'],
        general: [
          ['Smart Hibernation', 'Suspend inactive tabs in the background'],
          ['Telemetry Blocking', 'Disable Chromium trackers and metrics']
        ],
        search: ['Search Engine', 'Choose the engine for the address bar'],
        privacy: [
          ['Do Not Track (DNT)', 'Send DNT header on every request'],
          ['Clear Cookies on Exit', 'Delete all cookies when the browser closes'],
          ['Clear Cache on Exit', 'Clear the cache when the browser closes']
        ],
        shield: [
          ['Block Ads', 'Block known advertising domains'],
          ['Block Trackers', 'Block tracking and analytics domains'],
          ['Block Telemetry', 'Block browser/OS telemetry domains'],
          ['Blocked Domains', 'Custom blacklist of blocked domains'],
          ['Blocked Requests', '']
        ],
        themeOptions: ['Dark', 'Light', 'Auto'],
        appearance: [
          ['Interface Theme', 'Dark / Light browser theme'],
          ['Force Dark Mode', 'Force dark theme on every website'],
          ['Vertical Tabs', 'Place tabs in a vertical sidebar'],
          ['Accent Color', 'Main browser accent color'],
          ['Interface Density', 'Adjust the spacing of the toolbar and tabs']
        ],
        customize: [
          ['Home Button', 'Show the Home button in the navigation bar'],
          ['Sidebar', 'Show the shortcut sidebar'],
          ['Languages', 'Change the whole interface language'],
          ['Home Background', 'Custom image for the new tab background'],
          ['Local Sync', 'Export or import config, profiles, bookmarks and history']
        ],
        sync: {
          title: 'Local Sync',
          description: 'Save or restore your Neutron data to a JSON file',
          export: 'Export data',
          import: 'Import data',
          exported: 'Export complete',
          imported: 'Import complete',
          cancelled: 'Operation cancelled',
          failed: 'Sync error'
        },
        shieldBlockCurrentSite: 'Block current site',
        performance: [
          ['Disable WebRTC', 'Prevents local IP leaks (important for VPNs)'],
          ['Disable HW Acceleration', 'For older hardware or driver issues'],
          ['Energy Saver', 'Reduce FPS to 30, speed up hibernation and disable heavy effects'],
          ['Session Restore', 'Reopen tabs when Neutron starts']
        ],
        restartBadge: 'RESTART REQUIRED',
        restartPrompt: 'This change requires restarting Neutron. Continue?',
        addDomain: '+ Add',
        domainPlaceholder: 'e.g. evil-tracker.com',
        select: 'Select',
        clear: '✕',
        purge: 'PURGE MEMORY',
        purging: 'PURGING...',
        noImage: 'No image selected',
        statsBefore: 'Before',
        statsAfter: 'After',
        statsFreed: 'Freed',
        statsPartitions: 'Partitions',
        statsActiveTabs: 'Active tabs',
        before: 'Before',
        after: 'After',
        freed: 'Freed',
        partitions: 'Partitions',
        activeTabs: 'Active tabs',
        v8: 'V8 engine',
        calculating: 'Calculating...',
        languageOptionEs: 'Español',
        languageOptionEn: 'English',
        languageOptionPt: 'Português',
        languageOptionFr: 'Français'
      },
      history: {
        clearAll: 'Clear all',
        close: 'Close',
        empty: 'No browsing history',
        delete: 'Delete',
        visits: 'visits'
      },
      favorites: {
        close: 'Close',
        empty: 'No saved favorites',
        remove: 'Remove favorite'
      },
      downloads: {
        close: 'Close',
        empty: 'No active downloads',
        cancel: 'Cancel',
        complete: 'Completed',
        error: 'Error',
        pause: 'Pause',
        resume: 'Resume',
        openFolder: 'Open folder'
      },
      onboarding: {
        title: 'Welcome to Neutron',
        subtitle: 'Fast, private, and optimized browser',
        selectLanguage: 'Select your language',
        selectTheme: 'Choose your theme',
        darkTheme: 'Dark',
        lightTheme: 'Light',
        autoTheme: 'Auto',
        start: 'Get Started',
        canChangeAnytime: 'You can change this later in settings'
      }
    },
    pt: {
      main: {
        back: 'Voltar',
        forward: 'Avançar',
        reload: 'Recarregar',
        copy: 'Copiar',
        paste: 'Colar',
        selectAll: 'Selecionar tudo',
        saveImageAs: 'Salvar imagem como...',
        saveLinkAs: 'Salvar link como...',
        inspectElement: 'Inspecionar elemento'
      },
      chrome: {
        title: 'Neutron Browser',
        brand: 'Neutron',
        atomicMode: 'ATOMIC MODE',
        defaultProfile: 'Padrão',
        guestProfile: 'Convidado',
        customBrowsing: 'Navegação personalizada',
        newTab: 'Nova aba',
        closeTab: 'Fechar aba',
        duplicateTab: 'Duplicar aba',
        pinTab: 'Fixar aba',
        unpinTab: 'Desafixar aba',
        closeOtherTabs: 'Fechar outras abas',
        pinnedTab: 'Aba fixada',
        back: 'Voltar',
        forward: 'Avançar',
        reload: 'Recarregar',
        home: 'Início',
        settings: 'Configurações',
        history: 'Histórico',
        favorites: 'Favoritos',
        addToFavorites: 'Adicionar aos favoritos',
        addToSidebar: 'Adicionar à Sidebar',
        addToHome: 'Adicionar ao Início',
        changeProfile: 'Trocar perfil',
        newProfile: '+ Novo perfil',
        newProfileTitle: 'Novo perfil',
        newProfileName: 'Nome do perfil',
        guestMode: 'Modo convidado',
        cancel: 'Cancelar',
        create: 'Criar',
        deleteProfile: 'Excluir perfil',
        removeBookmark: 'Remover favorito',
        welcome: 'Bem-vindo ao Neutron',
        chooseProfile: 'Escolha um perfil para começar',
        urlPlaceholder: 'Pesquise no Google ou digite uma URL...',
        go: 'IR',
        minimize: 'Minimizar',
        maximize: 'Maximizar',
        closeWindow: 'Fechar',
        ramMeter: 'Uso de RAM do Neutron',
        shield: 'Proteções',
        downloads: 'Downloads',
        panic: 'Botão de pânico',
        clearCache: 'Limpar cache e RAM',
        showSidebar: 'Mostrar/ocultar barra lateral',
        tabTitleDefault: 'Nova aba'
      },
      home: {
        title: 'Neutron',
        searchPlaceholder: 'Buscar ou digitar URL...',
        searchButton: 'Buscar',
        caption: 'UM NAVEGADOR PARA TODOS',
        brand: 'NEUTRON'
      },
      settings: {
        title: 'Configurações',
        header: 'Configurações',
        version: 'Neutron Browser v2.0.0',
        tabs: ['Geral', 'Busca', 'Privacidade', 'Escudo', 'Aparência', 'Personalização', 'Desempenho'],
        general: [
          ['Hibernação Inteligente', 'Suspende abas inativas em segundo plano'],
          ['Bloqueio de Telemetria', 'Desativa rastreadores e métricas do Chromium']
        ],
        search: ['Motor de Busca', 'Escolha o motor da barra de endereços'],
        privacy: [
          ['Do Not Track (DNT)', 'Envia o cabeçalho DNT em cada requisição'],
          ['Limpar cookies ao sair', 'Remove todos os cookies ao fechar o navegador'],
          ['Limpar cache ao sair', 'Limpa o cache ao fechar o navegador']
        ],
        shield: [
          ['Bloquear anúncios', 'Bloqueia domínios de publicidade conhecidos'],
          ['Bloquear rastreadores', 'Bloqueia domínios de tracking e analytics'],
          ['Bloquear telemetria', 'Bloqueia domínios de telemetria do navegador/OS'],
          ['Domínios bloqueados', 'Lista personalizada de domínios bloqueados'],
          ['Requisições bloqueadas', '']
        ],
        themeOptions: ['Escuro', 'Claro', 'Automático'],
        appearance: [
          ['Tema da interface', 'Tema escuro / claro do navegador'],
          ['Forçar modo escuro', 'Força tema escuro em todos os sites'],
          ['Abas verticais', 'Coloca as abas em uma barra lateral vertical'],
          ['Cor de destaque', 'Cor principal do navegador'],
          ['Densidade da interface', 'Ajusta o espaçamento da barra e das abas']
        ],
        customize: [
          ['Botão Início', 'Mostra o botão Início na barra de navegação'],
          ['Barra lateral', 'Mostra a barra de atalhos'],
          ['Idiomas', 'Altera o idioma de toda a interface'],
          ['Fundo inicial', 'Imagem personalizada para a nova aba'],
          ['Sincronização local', 'Exporta ou importa config, perfis, favoritos e histórico']
        ],
        sync: {
          title: 'Sincronização local',
          description: 'Salva ou restaura seus dados do Neutron em um arquivo JSON',
          export: 'Exportar dados',
          import: 'Importar dados',
          exported: 'Exportação concluída',
          imported: 'Importação concluída',
          cancelled: 'Operação cancelada',
          failed: 'Erro de sincronização'
        },
        shieldBlockCurrentSite: 'Bloquear site atual',
        performance: [
          ['Desativar WebRTC', 'Evita vazamento de IP local (importante para VPNs)'],
          ['Desativar aceleração HW', 'Para hardware antigo ou problemas de driver'],
          ['Economia de energia', 'Reduz FPS para 30, acelera hibernação e desativa efeitos pesados'],
          ['Restauração de sessão', 'Reabre as abas ao iniciar o Neutron']
        ],
        restartBadge: 'REINÍCIO NECESSÁRIO',
        restartPrompt: 'Esta alteração requer reiniciar o Neutron. Continuar?',
        addDomain: '+ Adicionar',
        domainPlaceholder: 'ex: evil-tracker.com',
        select: 'Selecionar',
        clear: '✕',
        purge: 'LIMPAR MEMÓRIA',
        purging: 'LIMPANDO...',
        noImage: 'Nenhuma imagem selecionada',
        statsBefore: 'Antes',
        statsAfter: 'Depois',
        statsFreed: 'Liberado',
        statsPartitions: 'Partições',
        statsActiveTabs: 'Abas ativas',
        before: 'Antes',
        after: 'Depois',
        freed: 'Liberado',
        partitions: 'Partições',
        activeTabs: 'Abas ativas',
        v8: 'Motor V8',
        calculating: 'Calculando...',
        languageOptionEs: 'Español',
        languageOptionEn: 'English',
        languageOptionPt: 'Português',
        languageOptionFr: 'Français'
      },
      history: {
        clearAll: 'Limpar tudo',
        close: 'Fechar',
        empty: 'Sem histórico de navegação',
        delete: 'Excluir',
        visits: 'visitas'
      },
      favorites: {
        close: 'Fechar',
        empty: 'Sem favoritos salvos',
        remove: 'Remover favorito'
      },
      downloads: {
        close: 'Fechar',
        empty: 'Sem downloads ativos',
        cancel: 'Cancelar',
        complete: 'Concluído',
        error: 'Erro',
        pause: 'Pausar',
        resume: 'Retomar',
        openFolder: 'Abrir pasta'
      },
      onboarding: {
        title: 'Bem-vindo ao Neutron',
        subtitle: 'Navegador rápido, privado e otimizado',
        selectLanguage: 'Selecione seu idioma',
        selectTheme: 'Escolha seu tema',
        darkTheme: 'Escuro',
        lightTheme: 'Claro',
        autoTheme: 'Automático',
        start: 'Começar',
        canChangeAnytime: 'Você pode mudar isso depois nas configurações'
      }
    },
    fr: {
      main: {
        back: 'Retour',
        forward: 'Avancer',
        reload: 'Recharger',
        copy: 'Copier',
        paste: 'Coller',
        selectAll: 'Tout sélectionner',
        saveImageAs: 'Enregistrer l’image sous...',
        saveLinkAs: 'Enregistrer le lien sous...',
        inspectElement: 'Inspecter l’élément'
      },
      chrome: {
        title: 'Neutron Browser',
        brand: 'Neutron',
        atomicMode: 'ATOMIC MODE',
        defaultProfile: 'Par défaut',
        guestProfile: 'Invité',
        customBrowsing: 'Navigation personnalisée',
        newTab: 'Nouvel onglet',
        closeTab: 'Fermer l’onglet',
        duplicateTab: 'Dupliquer l’onglet',
        pinTab: 'Épingler l’onglet',
        unpinTab: 'Désépingler l’onglet',
        closeOtherTabs: 'Fermer les autres onglets',
        pinnedTab: 'Onglet épinglé',
        back: 'Retour',
        forward: 'Avancer',
        reload: 'Recharger',
        home: 'Accueil',
        settings: 'Paramètres',
        history: 'Historique',
        favorites: 'Favoris',
        addToFavorites: 'Ajouter aux favoris',
        addToSidebar: 'Ajouter à la barre latérale',
        addToHome: 'Ajouter à l’accueil',
        changeProfile: 'Changer de profil',
        newProfile: '+ Nouveau profil',
        newProfileTitle: 'Nouveau profil',
        newProfileName: 'Nom du profil',
        guestMode: 'Mode invité',
        cancel: 'Annuler',
        create: 'Créer',
        deleteProfile: 'Supprimer le profil',
        removeBookmark: 'Supprimer le marque-page',
        welcome: 'Bienvenue sur Neutron',
        chooseProfile: 'Choisissez un profil pour commencer',
        urlPlaceholder: 'Rechercher sur Google ou saisir une URL...',
        go: 'GO',
        minimize: 'Réduire',
        maximize: 'Agrandir',
        closeWindow: 'Fermer',
        ramMeter: 'Utilisation RAM de Neutron',
        shield: 'Protections',
        downloads: 'Téléchargements',
        panic: 'Bouton panique',
        clearCache: 'Vider le cache et la RAM',
        showSidebar: 'Afficher/masquer la barre latérale',
        tabTitleDefault: 'Nouvel onglet'
      },
      home: {
        title: 'Neutron',
        searchPlaceholder: 'Rechercher ou saisir une URL...',
        searchButton: 'Rechercher',
        caption: 'UN NAVIGATEUR POUR TOUS',
        brand: 'NEUTRON'
      },
      settings: {
        title: 'Paramètres',
        header: 'Paramètres',
        version: 'Neutron Browser v2.0.0',
        tabs: ['Général', 'Recherche', 'Confidentialité', 'Bouclier', 'Apparence', 'Personnalisation', 'Performances'],
        general: [
          ['Hibernation intelligente', 'Suspend les onglets inactifs en arrière-plan'],
          ['Blocage de la télémétrie', 'Désactive les traqueurs et métriques Chromium']
        ],
        search: ['Moteur de recherche', 'Choisissez le moteur de la barre d’adresse'],
        privacy: [
          ['Do Not Track (DNT)', 'Envoie l’en-tête DNT à chaque requête'],
          ['Effacer les cookies à la fermeture', 'Supprime tous les cookies à la fermeture du navigateur'],
          ['Effacer le cache à la fermeture', 'Vide le cache à la fermeture du navigateur']
        ],
        shield: [
          ['Bloquer les publicités', 'Bloque les domaines publicitaires connus'],
          ['Bloquer les traqueurs', 'Bloque les domaines de suivi et d’analytics'],
          ['Bloquer la télémétrie', 'Bloque les domaines de télémétrie du navigateur/OS'],
          ['Domaines bloqués', 'Liste personnalisée de domaines bloqués'],
          ['Requêtes bloquées', '']
        ],
        themeOptions: ['Sombre', 'Clair', 'Auto'],
        appearance: [
          ['Thème de l’interface', 'Thème sombre / clair du navigateur'],
          ['Forcer le mode sombre', 'Force le thème sombre sur tous les sites'],
          ['Onglets verticaux', 'Place les onglets dans une barre latérale verticale'],
          ['Couleur d’accent', 'Couleur principale du navigateur'],
          ['Densité de l’interface', 'Ajuste l’espacement de la barre et des onglets']
        ],
        customize: [
          ['Bouton Accueil', 'Affiche le bouton Accueil dans la barre de navigation'],
          ['Barre latérale', 'Affiche la barre de raccourcis'],
          ['Langues', 'Change la langue de toute l’interface'],
          ['Fond d’accueil', 'Image personnalisée pour le fond du nouvel onglet'],
          ['Synchronisation locale', 'Exportez ou importez config, profils, favoris et historique']
        ],
        sync: {
          title: 'Synchronisation locale',
          description: 'Enregistrez ou restaurez vos données Neutron dans un fichier JSON',
          export: 'Exporter les données',
          import: 'Importer les données',
          exported: 'Exportation terminée',
          imported: 'Importation terminée',
          cancelled: 'Opération annulée',
          failed: 'Erreur de synchronisation'
        },
        shieldBlockCurrentSite: 'Bloquer le site actuel',
        performance: [
          ['Désactiver WebRTC', 'Empêche les fuites d’IP locale (utile pour les VPN)'],
          ['Désactiver l’accélération HW', 'Pour le matériel ancien ou les problèmes de pilotes'],
          ['Économie d’énergie', 'Réduit les FPS à 30, accélère l’hibernation et désactive les effets lourds'],
          ['Restauration de session', 'Rouvre les onglets au démarrage de Neutron']
        ],
        restartBadge: 'REDÉMARRAGE REQUIS',
        restartPrompt: 'Ce changement nécessite de redémarrer Neutron. Continuer ?',
        addDomain: '+ Ajouter',
        domainPlaceholder: 'ex. evil-tracker.com',
        select: 'Sélectionner',
        clear: '✕',
        purge: 'VIDER LA RAM',
        purging: 'VIDAGE...',
        noImage: 'Aucune image sélectionnée',
        statsBefore: 'Avant',
        statsAfter: 'Après',
        statsFreed: 'Libéré',
        statsPartitions: 'Partitions',
        statsActiveTabs: 'Onglets actifs',
        before: 'Avant',
        after: 'Après',
        freed: 'Libéré',
        partitions: 'Partitions',
        activeTabs: 'Onglets actifs',
        v8: 'Moteur V8',
        calculating: 'Calcul en cours...',
        languageOptionEs: 'Español',
        languageOptionEn: 'English',
        languageOptionPt: 'Português',
        languageOptionFr: 'Français'
      },
      history: {
        clearAll: 'Tout effacer',
        close: 'Fermer',
        empty: 'Aucun historique de navigation',
        delete: 'Supprimer',
        visits: 'visites'
      },
      favorites: {
        close: 'Fermer',
        empty: 'Aucun favori enregistré',
        remove: 'Supprimer le favori'
      },
      downloads: {
        close: 'Fermer',
        empty: 'Aucun téléchargement actif',
        cancel: 'Annuler',
        complete: 'Terminé',
        error: 'Erreur',
        pause: 'Pause',
        resume: 'Reprendre',
        openFolder: 'Ouvrir le dossier'
      },
      onboarding: {
        title: 'Bienvenue dans Neutron',
        subtitle: 'Navigateur rapide, privé et optimisé',
        selectLanguage: 'Sélectionnez votre langue',
        selectTheme: 'Choisissez votre thème',
        darkTheme: 'Sombre',
        lightTheme: 'Clair',
        autoTheme: 'Automatique',
        start: 'Commencer',
        canChangeAnytime: 'Vous pouvez changer cela plus tard dans les paramètres'
      }
    }
  };

  function normalize(lang) {
    return STRINGS[lang] ? lang : 'es';
  }

  function t(lang, path) {
    const locale = STRINGS[normalize(lang)];
    return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), locale) ?? path;
  }

  function setText(el, value) {
    if (el) el.textContent = value;
  }

  function setTitle(el, value) {
    if (el) el.title = value;
  }

  function setPlaceholder(el, value) {
    if (el) el.placeholder = value;
  }

  function applyIndexPage(lang) {
    const locale = normalize(lang);
    const L = (path) => t(locale, path);
    if (typeof document === 'undefined') return;

    document.documentElement.lang = locale;
    document.title = L('chrome.title');

    setText(document.getElementById('logo-text'), L('chrome.brand'));
    if (document.body.classList.contains('atomic-mode')) {
      setText(document.getElementById('logo-text'), L('chrome.atomicMode'));
    }

    setTitle(document.getElementById('add-tab-btn'), L('chrome.newTab'));
    setTitle(document.getElementById('win-minimize'), L('chrome.minimize'));
    setTitle(document.getElementById('win-maximize'), L('chrome.maximize'));
    setTitle(document.getElementById('win-close'), L('chrome.closeWindow'));
    setTitle(document.getElementById('toggle-sidebar'), L('chrome.showSidebar'));
    setTitle(document.getElementById('nav-back'), L('chrome.back'));
    setTitle(document.getElementById('nav-forward'), L('chrome.forward'));
    setTitle(document.getElementById('nav-reload'), L('chrome.reload'));
    setTitle(document.getElementById('nav-home'), L('chrome.home'));
    setPlaceholder(document.getElementById('url-input'), L('chrome.urlPlaceholder'));
    setText(document.getElementById('nav-go'), L('chrome.go'));
    setTitle(document.getElementById('settings-btn'), L('chrome.settings'));
    setTitle(document.getElementById('history-btn'), L('chrome.history'));
    setTitle(document.getElementById('fav-btn'), L('chrome.addToFavorites'));
    setTitle(document.getElementById('fav-chevron'), L('chrome.addToSidebar'));
    setTitle(document.getElementById('shield-btn'), L('chrome.shield'));
    setTitle(document.getElementById('downloads-btn'), L('chrome.downloads'));
    setTitle(document.getElementById('sidebar-fav-btn'), L('chrome.favorites'));
    setTitle(document.getElementById('atomic-mode-btn'), L('chrome.guestMode'));
    setTitle(document.getElementById('clean-cache-btn'), L('chrome.clearCache'));
    setTitle(document.getElementById('panic-btn'), L('chrome.panic'));
    setTitle(document.querySelector('.ram-meter-container'), L('chrome.ramMeter'));

    setTitle(document.getElementById('new-profile-btn'), L('chrome.newProfile'));
    setTitle(document.getElementById('guest-mode-btn'), L('chrome.guestMode'));
    setTitle(document.getElementById('modal-new-profile-btn'), L('chrome.newProfile'));
    setTitle(document.getElementById('modal-guest-btn'), L('chrome.guestMode'));
    setText(document.getElementById('cancel-profile-btn'), L('chrome.cancel'));
    setText(document.getElementById('confirm-profile-btn'), L('chrome.create'));
    setTitle(document.getElementById('profile-indicator'), L('chrome.changeProfile'));
    setPlaceholder(document.getElementById('new-profile-name'), L('chrome.newProfileName'));

    const profileModalHeader = document.querySelector('#profile-modal .profile-modal-header');
    if (profileModalHeader) {
      setText(profileModalHeader.querySelector('h2'), L('chrome.welcome'));
      setText(profileModalHeader.querySelector('p'), L('chrome.chooseProfile'));
    }

    setText(document.querySelector('#new-profile-dialog h3'), L('chrome.newProfile'));
    setPlaceholder(document.getElementById('new-profile-name'), L('chrome.newProfileName'));
    setText(document.querySelector('#fav-dropdown li[data-type="fav"]'), `★ ${L('chrome.addToFavorites')}`);
    setText(document.querySelector('#fav-dropdown li[data-type="sidebar"]'), `📌 ${L('chrome.addToSidebar')}`);
    setText(document.querySelector('#fav-dropdown li[data-type="home"]'), `🏠 ${L('chrome.addToHome')}`);
    setText(document.getElementById('bookmark-ctx-remove'), `✕ ${L('chrome.removeBookmark')}`);

    const profileIndicatorName = document.getElementById('profile-indicator-name');
    if (profileIndicatorName) {
      const current = profileIndicatorName.textContent.trim();
      if (['Default', 'Invitado', 'Guest', 'Convidado', 'Invité', 'Padrão', 'Par défaut'].includes(current)) {
        profileIndicatorName.textContent = L('chrome.defaultProfile');
      }
    }
  }

  function applyHomePage(lang) {
    const locale = normalize(lang);
    const L = (path) => t(locale, path);
    if (typeof document === 'undefined') return;
    document.documentElement.lang = locale;
    document.title = L('home.title');
    setPlaceholder(document.getElementById('search-input'), L('home.searchPlaceholder'));
    setText(document.getElementById('search-btn'), L('home.searchButton'));
    setText(document.querySelector('.search-caption'), L('home.caption'));
    setText(document.querySelector('.brand-text'), L('home.brand'));
  }

  function applySettingsPage(lang) {
    const locale = normalize(lang);
    const L = (path) => t(locale, path);
    if (typeof document === 'undefined') return;

    document.documentElement.lang = locale;
    document.title = `${L('settings.title')} - Neutron`;
    setText(document.querySelector('.header-text h1'), L('settings.header'));
    setText(document.querySelector('.header-text span'), L('settings.version'));

    const tabs = document.querySelectorAll('.tabs .tab-btn');
    const tabLabels = t(locale, 'settings.tabs');
    tabs.forEach((btn, idx) => {
      if (tabLabels[idx]) btn.textContent = tabLabels[idx];
    });

    const generalCards = document.querySelectorAll('#panel-general .card');
    if (generalCards[0]) {
      setText(generalCards[0].querySelector('.card-label h3'), t(locale, 'settings.general.0.0'));
      setText(generalCards[0].querySelector('.card-label p'), t(locale, 'settings.general.0.1'));
    }
    if (generalCards[1]) {
      setText(generalCards[1].querySelector('.card-label h3'), t(locale, 'settings.general.1.0'));
      setText(generalCards[1].querySelector('.card-label p'), t(locale, 'settings.general.1.1'));
    }

    const searchCard = document.querySelector('#panel-search .card');
    if (searchCard) {
      setText(searchCard.querySelector('.card-label h3'), t(locale, 'settings.search.0'));
      setText(searchCard.querySelector('.card-label p'), t(locale, 'settings.search.1'));
    }

    const privacyCards = document.querySelectorAll('#panel-privacy .card');
    privacyCards.forEach((card, idx) => {
      setText(card.querySelector('.card-label h3'), t(locale, `settings.privacy.${idx}.0`));
      setText(card.querySelector('.card-label p'), t(locale, `settings.privacy.${idx}.1`));
    });

    const shieldCards = document.querySelectorAll('#panel-shield .card');
    shieldCards.forEach((card, idx) => {
      if (idx < 4) {
        setText(card.querySelector('.card-label h3'), t(locale, `settings.shield.${idx}.0`));
        setText(card.querySelector('.card-label p'), t(locale, `settings.shield.${idx}.1`));
      }
    });
    setText(document.getElementById('shield-add-domain-btn'), t(locale, 'settings.addDomain'));
    setPlaceholder(document.getElementById('shield-domain-input'), L('settings.domainPlaceholder'));
    setText(document.getElementById('shield-block-current-btn'), L('settings.shieldBlockCurrentSite'));
    if (shieldCards[4]) {
      setText(shieldCards[4].querySelector('.card-label h3'), t(locale, 'settings.shield.4.0'));
      setText(shieldCards[4].querySelector('.card-label p'), t(locale, 'settings.shield.4.1'));
    }

    const appearanceCards = document.querySelectorAll('#panel-appearance .card');
    if (appearanceCards[0]) {
      setText(appearanceCards[0].querySelector('.card-label h3'), t(locale, 'settings.appearance.0.0'));
      setText(appearanceCards[0].querySelector('.card-label p'), t(locale, 'settings.appearance.0.1'));
      const labels = appearanceCards[0].querySelectorAll('.radio-label');
      const themeLabels = t(locale, 'settings.themeOptions');
      if (labels[0] && themeLabels[0]) labels[0].textContent = `🌙 ${themeLabels[0]}`;
      if (labels[1] && themeLabels[1]) labels[1].textContent = `☀️ ${themeLabels[1]}`;
      if (labels[2] && themeLabels[2]) labels[2].textContent = `🌓 ${themeLabels[2]}`;
    }
    if (appearanceCards[1]) {
      appearanceCards[1].querySelector('.card-label h3').innerHTML = `${t(locale, 'settings.appearance.1.0')}<span class="restart-badge">${L('settings.restartBadge')}</span>`;
      setText(appearanceCards[1].querySelector('.card-label p'), t(locale, 'settings.appearance.1.1'));
    }
    if (appearanceCards[2]) {
      setText(appearanceCards[2].querySelector('.card-label h3'), t(locale, 'settings.appearance.2.0'));
      setText(appearanceCards[2].querySelector('.card-label p'), t(locale, 'settings.appearance.2.1'));
    }
    if (appearanceCards[3]) {
      setText(appearanceCards[3].querySelector('.card-label h3'), t(locale, 'settings.appearance.3.0'));
      setText(appearanceCards[3].querySelector('.card-label p'), t(locale, 'settings.appearance.3.1'));
    }
    if (appearanceCards[4]) {
      setText(appearanceCards[4].querySelector('.card-label h3'), t(locale, 'settings.appearance.4.0'));
      setText(appearanceCards[4].querySelector('.card-label p'), t(locale, 'settings.appearance.4.1'));
    }

    const customizeCards = document.querySelectorAll('#panel-customize .card');
    customizeCards.forEach((card, idx) => {
      if (idx < 5) {
        setText(card.querySelector('.card-label h3'), t(locale, `settings.customize.${idx}.0`));
        setText(card.querySelector('.card-label p'), t(locale, `settings.customize.${idx}.1`));
      }
    });
    setText(document.getElementById('sync-card-title'), t(locale, 'settings.sync.title'));
    setText(document.getElementById('sync-card-desc'), t(locale, 'settings.sync.description'));
    setText(document.getElementById('sync-export-btn'), t(locale, 'settings.sync.export'));
    setText(document.getElementById('sync-import-btn'), t(locale, 'settings.sync.import'));
    const langSelect = document.getElementById('language-select');
    if (langSelect) {
      const options = langSelect.querySelectorAll('option');
      if (options[0]) options[0].textContent = L('settings.languageOptionEs');
      if (options[1]) options[1].textContent = L('settings.languageOptionEn');
      if (options[2]) options[2].textContent = L('settings.languageOptionPt');
      if (options[3]) options[3].textContent = L('settings.languageOptionFr');
    }
    setText(document.getElementById('select-bg-btn'), L('settings.select'));
    setText(document.getElementById('clear-bg-btn'), L('settings.clear'));
    setPlaceholder(document.getElementById('bg-path-display'), L('settings.noImage'));

    const perfCards = document.querySelectorAll('#panel-performance .card');
    if (perfCards[0]) {
      perfCards[0].querySelector('.card-label h3').innerHTML = `${t(locale, 'settings.performance.0.0')}<span class="restart-badge">${L('settings.restartBadge')}</span>`;
      setText(perfCards[0].querySelector('.card-label p'), t(locale, 'settings.performance.0.1'));
    }
    if (perfCards[1]) {
      perfCards[1].querySelector('.card-label h3').innerHTML = `${t(locale, 'settings.performance.1.0')}<span class="restart-badge">${L('settings.restartBadge')}</span>`;
      setText(perfCards[1].querySelector('.card-label p'), t(locale, 'settings.performance.1.1'));
    }
    if (perfCards[2]) {
      setText(perfCards[2].querySelector('.card-label h3'), t(locale, 'settings.performance.2.0'));
      setText(perfCards[2].querySelector('.card-label p'), t(locale, 'settings.performance.2.1'));
    }
    if (perfCards[3]) {
      setText(perfCards[3].querySelector('.card-label h3'), t(locale, 'settings.performance.3.0'));
      setText(perfCards[3].querySelector('.card-label p'), t(locale, 'settings.performance.3.1'));
    }

    const purgeBtn = document.getElementById('purge-btn');
    if (purgeBtn) {
      purgeBtn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18"><path d="M15 4V3H9v1H4v2h1v13c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V6h1V4h-5zm2 15H7V6h10v13z" /></svg> ${L('settings.purge')}`;
    }
    setText(document.querySelector('.status-bar span'), L('settings.v8'));
    setText(document.getElementById('ram-display'), L('settings.calculating'));
    setText(document.querySelector('.version'), L('settings.version'));
  }

  function applyHistoryPage(lang) {
    const locale = normalize(lang);
    const L = (path) => t(locale, path);
    if (typeof document === 'undefined') return;
    document.documentElement.lang = locale;
    document.title = `${L('chrome.history')} - ${L('chrome.title')}`;
    setText(document.querySelector('.history-header h3'), L('chrome.history'));
    setText(document.getElementById('clear-history-btn'), L('history.clearAll'));
    setTitle(document.getElementById('clear-history-btn'), L('history.clearAll'));
    setTitle(document.getElementById('close-history-btn'), L('history.close'));
    const empty = document.querySelector('.history-empty');
    if (empty) empty.textContent = L('history.empty');
    document.querySelectorAll('.history-delete-btn').forEach((btn) => setTitle(btn, L('history.delete')));
    document.querySelectorAll('.history-item-visits').forEach((el) => {
      el.textContent = el.textContent.replace(/\bvisitas\b|\bvisits\b|\bvisites\b/gi, L('history.visits'));
    });
  }

  function applyFavoritesPage(lang) {
    const locale = normalize(lang);
    const L = (path) => t(locale, path);
    if (typeof document === 'undefined') return;
    document.documentElement.lang = locale;
    document.title = `${L('chrome.favorites')} - ${L('chrome.title')}`;
    setText(document.querySelector('.favorites-header h3'), L('chrome.favorites'));
    setTitle(document.getElementById('close-favorites-btn'), L('favorites.close'));
    const empty = document.querySelector('.favorites-empty');
    if (empty) empty.textContent = L('favorites.empty');
    document.querySelectorAll('.favorite-remove-btn').forEach((btn) => setTitle(btn, L('favorites.remove')));
  }

  function applyDownloadsPage(lang) {
    const locale = normalize(lang);
    const L = (path) => t(locale, path);
    if (typeof document === 'undefined') return;
    document.documentElement.lang = locale;
    document.title = `${L('chrome.downloads')} - ${L('chrome.title')}`;
    setText(document.querySelector('.downloads-header span'), L('chrome.downloads'));
    setTitle(document.getElementById('close-downloads-btn'), L('downloads.close'));
    const empty = document.querySelector('.dl-empty');
    if (empty) empty.textContent = L('downloads.empty');
    document.querySelectorAll('.dl-cancel').forEach((btn) => setTitle(btn, L('downloads.cancel')));
    document.querySelectorAll('.dl-pause').forEach((btn) => setTitle(btn, L('downloads.pause')));
    document.querySelectorAll('.dl-resume').forEach((btn) => setTitle(btn, L('downloads.resume')));
    document.querySelectorAll('.dl-open-folder').forEach((btn) => setTitle(btn, L('downloads.openFolder')));
    document.querySelectorAll('.dl-status-complete').forEach((el) => { el.textContent = L('downloads.complete'); });
    document.querySelectorAll('.dl-status-error').forEach((el) => { el.textContent = L('downloads.error'); });
  }

  return {
    t,
    normalize,
    applyIndexPage,
    applyHomePage,
    applySettingsPage,
    applyHistoryPage,
    applyFavoritesPage,
    applyDownloadsPage
  };
});
