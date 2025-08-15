import React, { useState, useEffect, createContext, useContext, useRef, forwardRef } from 'react';

// UTILS - Funções utilitárias (cn para classes)
// Arquivo: src/lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// --- FUNÇÕES DE VALIDAÇÃO E FORMATAÇÃO ---
function validateCPF(cpf) {
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf === '' || cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  let add = 0;
  for (let i = 0; i < 9; i++) add += parseInt(cpf.charAt(i)) * (10 - i);
  let rev = 11 - (add % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cpf.charAt(9))) return false;
  add = 0;
  for (let i = 0; i < 10; i++) add += parseInt(cpf.charAt(i)) * (11 - i);
  rev = 11 - (add % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cpf.charAt(10))) return false;
  return true;
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function formatCPF(value) {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .substring(0, 14);
}

function formatCurrency(value) {
    if (typeof value !== 'number') {
        value = Number(value) || 0;
    }
    return value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}


// --- DATABASE SIMULATION (localStorage) ---
// Simula um banco de dados para persistir os dados no navegador
const initialCategories = [
    { id: 'arte', name: 'Arte', image: 'https://i.imgur.com/7KqyV52.jpeg' },
    { id: 'colecionaveis', name: 'Colecionáveis', image: 'https://i.imgur.com/gA3CfA6.jpeg' },
    { id: 'eletronicos', name: 'Eletrônicos', image: 'https://i.imgur.com/8bXZEQJ.png' },
    { id: 'joias', name: 'Joias', image: 'https://i.imgur.com/O6a6358.jpeg' },
    { id: 'roupas', name: 'Roupas', image: 'https://i.imgur.com/sY21v5t.jpeg' },
    { id: 'decoracao', name: 'Decoração', image: 'https://i.imgur.com/qWbVp5E.jpeg' },
];

const initialUsers = [
    {
        id: 1,
        name: 'Gabriel Dantão',
        email: 'gabriel@email.com',
        password: '123',
        cpf: '123.456.789-00',
        avatar: 'https://i.imgur.com/kA78mGe.jpeg',
        memberSince: new Date().getFullYear()
    }
];

const initialAuctions = [
  {
    id: 1,
    title: "Pintura a Óleo 'Flores do Campo' por Morgana Zagury",
    description: "Lote único de arte moderna, perfeito para colecionadores exigentes.",
    category: 'arte',
    images: [
      'https://i.imgur.com/7KqyV52.jpeg',
      'https://i.imgur.com/gA3CfA6.jpeg',
      'https://i.imgur.com/O6a6358.jpeg',
      'https://i.imgur.com/sY21v5t.jpeg',
    ],
    details: { Artista: 'Morgana Zagury', Título: 'Flores do Campo', Técnica: 'Óleo sobre tela', Dimensões: '60 x 80 cm', Ano: '2023', Condição: 'Excelente' },
    auctionInfo: { currentBid: 1200, increment: 50, startBid: 1000 },
    endDate: "2025-09-20T23:59:00",
    bidHistory: [
      { user: 'Carlos Mendes', amount: 1200, date: '20/07/2024 14:28' },
      { user: 'Sofia Almeida', amount: 1150, date: '20/07/2024 14:25' },
    ],
    sellerInfo: { id: 1, name: 'Gabriel Dantão', avatar: 'https://i.imgur.com/kA78mGe.jpeg', memberSince: 'Vendedor desde 2024' },
  },
];

const db = {
    getData: (key, defaultValue = []) => {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error(`Error reading from localStorage key “${key}”:`, error);
            return defaultValue;
        }
    },
    setData: (key, data) => {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error(`Error writing to localStorage key “${key}”:`, error);
        }
    },
    initialize: () => {
        if (!localStorage.getItem('auctions')) db.setData('auctions', initialAuctions);
        if (!localStorage.getItem('users')) db.setData('users', initialUsers);
        if (!localStorage.getItem('watchlist')) db.setData('watchlist', []);
    }
};

db.initialize();


// --- UI COMPONENTS ---
// Componentes de UI básicos e reutilizáveis.
// Arquivos: src/components/ui/*

const Button = forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = "button";
  const variantClasses = {
    default: "bg-slate-900 text-slate-50 hover:bg-slate-900/90",
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    destructive: "bg-red-500 text-slate-50 hover:bg-red-500/90",
    outline: "border border-slate-200 bg-transparent hover:bg-slate-100",
    secondary: "bg-slate-800 text-slate-50 hover:bg-slate-700",
    ghost: "hover:bg-slate-100 hover:text-slate-900",
    link: "text-slate-900 underline-offset-4 hover:underline",
  };
  const sizeClasses = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
    icon: "h-10 w-10",
  };
  return (
    <Comp
      className={cn("inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50", variantClasses[variant] || variantClasses.default, sizeClasses[size] || sizeClasses.default, className)}
      ref={ref}
      {...props} />
  );
});

const Input = forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn("flex h-12 w-full rounded-md border-none bg-slate-800 px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50", className)}
      ref={ref}
      {...props} />
  );
});

const Card = forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("rounded-lg border border-slate-800 bg-slate-900 text-slate-50 shadow-sm", className)}
    {...props} />
));
const CardHeader = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
));
const CardTitle = forwardRef(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />
));
const CardDescription = forwardRef(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-slate-400", className)} {...props} />
));
const CardContent = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
const CardFooter = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
));

const Table = forwardRef(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
  </div>
));
const TableHeader = forwardRef(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
));
const TableBody = forwardRef(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
));
const TableRow = forwardRef(({ className, ...props }, ref) => (
  <tr ref={ref} className={cn("border-b border-slate-800 transition-colors hover:bg-slate-800/50", className)} {...props} />
));
const TableHead = forwardRef(({ className, ...props }, ref) => (
  <th ref={ref} className={cn("h-12 px-4 text-left align-middle font-medium text-slate-400", className)} {...props} />
));
const TableCell = forwardRef(({ className, ...props }, ref) => (
  <td ref={ref} className={cn("p-4 align-middle", className)} {...props} />
));


// --- ICONS ---
// Ícones SVG para uso na UI
const SearchIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16" {...props}>
    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
  </svg>
);
const HeartIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16" {...props}>
        <path fillRule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z"/>
    </svg>
);
const LogoIcon = (props) => (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z" fill="currentColor"></path>
    </svg>
);


// --- CONTEXTS ---
// Gerenciamento de estado global para Autenticação e Dados dos Leilões

const AuthContext = createContext(null);
const AuctionContext = createContext(null);

const AuthProvider = ({ children }) => {
    const [loggedInUser, setLoggedInUser] = useState(() => db.getData('loggedInUser', null));

    const login = (email, password) => {
        const users = db.getData('users');
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            db.setData('loggedInUser', user);
            setLoggedInUser(user);
            return user;
        }
        return null;
    };

    const register = (name, email, password, cpf) => {
        let users = db.getData('users');
        if (users.find(u => u.email === email)) {
            throw new Error("Este email já está cadastrado.");
        }
        const newUser = {
            id: Date.now(),
            name,
            email,
            password,
            cpf,
            avatar: `https://placehold.co/128x128/3d6bf4/FFF?text=${name.charAt(0).toUpperCase()}`,
            memberSince: new Date().getFullYear(),
        };
        users.push(newUser);
        db.setData('users', users);
        return newUser;
    };

    const logout = () => {
        db.setData('loggedInUser', null);
        setLoggedInUser(null);
    };
    
    const updateUser = (updatedData) => {
        if (!loggedInUser) return;
        let users = db.getData('users');
        const updatedUser = { ...loggedInUser, ...updatedData };
        const finalUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
        db.setData('users', finalUsers);
        db.setData('loggedInUser', updatedUser);
        setLoggedInUser(updatedUser);
    };

    return (
        <AuthContext.Provider value={{ user: loggedInUser, login, logout, register, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

const AuctionProvider = ({ children }) => {
    const [auctions, setAuctions] = useState(() => db.getData('auctions'));
    const [watchlist, setWatchlist] = useState(() => db.getData('watchlist'));

    const getAuctionById = (id) => auctions.find(a => a.id === parseInt(id));

    const addAuction = (newAuctionData) => {
        const newAuction = {
            id: Date.now(),
            ...newAuctionData,
        };
        const updatedAuctions = [newAuction, ...auctions];
        setAuctions(updatedAuctions);
        db.setData('auctions', updatedAuctions);
        return newAuction;
    };

    const deleteAuction = (auctionId) => {
        const updatedAuctions = auctions.filter(auction => auction.id !== auctionId);
        setAuctions(updatedAuctions);
        db.setData('auctions', updatedAuctions);
    };
    
    const placeBid = (auctionId, amount, user) => {
        const updatedAuctions = auctions.map(auction => {
            if (auction.id === auctionId) {
                const newBidHistory = [{ user: user.name, amount, date: new Date().toLocaleString('pt-BR') }, ...auction.bidHistory];
                return {
                    ...auction,
                    auctionInfo: { ...auction.auctionInfo, currentBid: amount },
                    bidHistory: newBidHistory,
                };
            }
            return auction;
        });
        setAuctions(updatedAuctions);
        db.setData('auctions', updatedAuctions);
    };

    const toggleWatchlist = (auctionId) => {
        const newWatchlist = watchlist.includes(auctionId)
            ? watchlist.filter(id => id !== auctionId)
            : [...watchlist, auctionId];
        setWatchlist(newWatchlist);
        db.setData('watchlist', newWatchlist);
    };

    return (
        <AuctionContext.Provider value={{ auctions, getAuctionById, addAuction, deleteAuction, placeBid, watchlist, toggleWatchlist, categories: initialCategories }}>
            {children}
        </AuctionContext.Provider>
    );
};

// --- CUSTOM HOOKS ---
// Hooks personalizados para lógicas reutilizáveis

function useAuth() {
    return useContext(AuthContext);
}

function useAuctions() {
    return useContext(AuctionContext);
}

function useCountdown(endDate) {
    const [timeLeft, setTimeLeft] = useState({
        days: 0, hours: 0, minutes: 0, seconds: 0, isFinished: false
    });

    useEffect(() => {
        if (!endDate) return;

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const distance = new Date(endDate).getTime() - now;

            if (distance < 0) {
                clearInterval(interval);
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isFinished: true });
                return;
            }

            setTimeLeft({
                days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((distance % (1000 * 60)) / 1000),
                isFinished: false,
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [endDate]);

    return timeLeft;
}

// --- SHARED LAYOUT COMPONENTS ---
// Componentes de layout como Header, Footer e Navegação

const Header = () => {
    const { user, logout } = useAuth();
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef(null);

    // Fecha o dropdown se clicar fora
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);
    
    const navigateTo = (path) => {
        window.location.hash = path;
        setDropdownOpen(false);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigateTo(`/leiloes?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    return (
        <header className="flex items-center justify-between border-b border-slate-800 px-4 md:px-10 py-3 text-white whitespace-nowrap">
            <div className="flex items-center gap-8">
                <a href="#/" className="flex items-center gap-4 text-white no-underline">
                    <LogoIcon className="w-4 h-4" />
                    <h2 className="text-lg font-bold">Leilão do Dantão</h2>
                </a>
                <nav className="hidden md:flex items-center gap-9">
                    <a href="#/" className="text-sm font-medium hover:text-blue-400">Início</a>
                    <a href="#/categorias" className="text-sm font-medium hover:text-blue-400">Categorias</a>
                    <a href="#/como-funciona" className="text-sm font-medium hover:text-blue-400">Como Funciona</a>
                </nav>
            </div>
            <div className="flex flex-1 justify-end items-center gap-4">
                {user ? (
                    <>
                        <form onSubmit={handleSearch} className="hidden md:flex items-center bg-slate-800 rounded-md h-10 max-w-xs">
                            <input 
                                type="search" 
                                placeholder="Pesquisar leilões..." 
                                className="bg-transparent border-none text-white px-3 h-full focus:outline-none"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <button type="submit" className="bg-transparent border-none text-slate-400 px-3 cursor-pointer">
                                <SearchIcon />
                            </button>
                        </form>
                        <a href="#/lista-observacao" title="Lista de Observação" className="p-2 rounded-md hover:bg-slate-700">
                            <HeartIcon />
                        </a>
                        <div className="relative" ref={dropdownRef}>
                            <button onClick={() => setDropdownOpen(!isDropdownOpen)} className="flex items-center gap-3 bg-transparent border-none">
                                <img className="w-9 h-9 rounded-full object-cover" src={user.avatar} alt={`Avatar de ${user.name}`} />
                                <span className="hidden md:inline font-medium">Olá, {user.name.split(' ')[0]}</span>
                            </button>
                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-slate-800 rounded-md shadow-lg z-10 p-1">
                                    <a onClick={() => navigateTo('/anunciar-item')} className="block px-4 py-2 text-sm text-white hover:bg-slate-700 rounded cursor-pointer">Anunciar um Item</a>
                                    <a onClick={() => navigateTo('/minha-conta')} className="block px-4 py-2 text-sm text-white hover:bg-slate-700 rounded cursor-pointer">Minha Conta</a>
                                    <a onClick={() => navigateTo('/meus-leiloes')} className="block px-4 py-2 text-sm text-white hover:bg-slate-700 rounded cursor-pointer">Meus Leilões</a>
                                    <div className="border-t border-slate-700 my-1"></div>
                                    <a onClick={() => { logout(); navigateTo('/login'); }} className="block px-4 py-2 text-sm text-red-400 hover:bg-slate-700 rounded cursor-pointer">Sair</a>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <Button onClick={() => navigateTo('/login')} variant="secondary" size="sm">Entrar</Button>
                        <Button onClick={() => navigateTo('/cadastro')} variant="primary" size="sm">Cadastrar</Button>
                    </>
                )}
            </div>
        </header>
    );
};

const Footer = () => (
    <footer className="w-full bg-slate-950 text-slate-400 py-8 px-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
                <h3 className="font-bold text-white mb-4">Leilão do Dantão</h3>
                <p className="text-sm">Sua plataforma completa para leilões online. Encontre itens únicos e anuncie os seus com segurança.</p>
            </div>
            <div>
                <h3 className="font-bold text-white mb-4">Navegue</h3>
                <ul className="space-y-2 text-sm">
                    <li><a href="#/" className="hover:text-white">Início</a></li>
                    <li><a href="#/categorias" className="hover:text-white">Categorias</a></li>
                    <li><a href="#/como-funciona" className="hover:text-white">Como Funciona</a></li>
                </ul>
            </div>
            <div>
                <h3 className="font-bold text-white mb-4">Sua Conta</h3>
                <ul className="space-y-2 text-sm">
                    <li><a href="#/login" className="hover:text-white">Entrar</a></li>
                    <li><a href="#/cadastro" className="hover:text-white">Cadastrar</a></li>
                    <li><a href="#/minha-conta" className="hover:text-white">Minha Conta</a></li>
                </ul>
            </div>
            <div>
                <h3 className="font-bold text-white mb-4">Legal</h3>
                <ul className="space-y-2 text-sm">
                    <li><a href="#" className="hover:text-white">Termos de Serviço</a></li>
                    <li><a href="#" className="hover:text-white">Política de Privacidade</a></li>
                </ul>
            </div>
        </div>
        <div className="text-center text-xs mt-8 border-t border-slate-800 pt-6">
            © {new Date().getFullYear()} Leilão do Dantão. Todos os direitos reservados.
        </div>
    </footer>
);

const AppLayout = ({ children }) => (
    <div className="bg-slate-950 text-white min-h-screen flex flex-col font-sans">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
            {children}
        </main>
        <Footer />
    </div>
);


// --- PAGE COMPONENTS ---
// Componentes que representam cada página da aplicação.

const AuctionListPage = ({ categoryId, searchQuery }) => {
    const { auctions, categories } = useAuctions();

    const filteredAuctions = auctions.filter(auction => {
        const matchesCategory = categoryId ? auction.category === categoryId : true;
        const matchesSearch = searchQuery 
            ? auction.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
              auction.description.toLowerCase().includes(searchQuery.toLowerCase())
            : true;
        return matchesCategory && matchesSearch;
    });

    const categoryName = categoryId ? categories.find(c => c.id === categoryId)?.name : null;
    let title = "Leilões em Destaque";
    if (categoryName) title = `Leilões em ${categoryName}`;
    if (searchQuery) title = `Resultados para "${searchQuery}"`;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">{title}</h1>
            {filteredAuctions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAuctions.map(auction => (
                        <a href={`#/produto/${auction.id}`} key={auction.id} className="group block">
                            <Card className="overflow-hidden h-full flex flex-col">
                                <div className="overflow-hidden">
                                    <img src={auction.images[0]} alt={auction.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
                                </div>
                                <CardHeader>
                                    <CardTitle className="text-lg group-hover:text-blue-400">{auction.title}</CardTitle>
                                    <CardDescription>{auction.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="mt-auto">
                                    <div className="text-sm text-slate-400">Lance atual</div>
                                    <div className="text-xl font-bold">{formatCurrency(auction.auctionInfo.currentBid)}</div>
                                </CardContent>
                            </Card>
                        </a>
                    ))}
                </div>
            ) : (
                <p className="text-center text-slate-400 py-8">Nenhum leilão encontrado com os critérios selecionados.</p>
            )}
        </div>
    );
};


const CategoriesPage = () => {
    const { categories } = useAuctions();
    return (
         <div>
            <h1 className="text-3xl font-bold mb-6">Categorias</h1>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {categories.map(category => (
                    <a href={`#/categoria/${category.id}`} key={category.id} className="group block text-center">
                         <Card className="overflow-hidden">
                            <div className="aspect-square overflow-hidden">
                                <img src={category.image} alt={category.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            </div>
                            <CardFooter className="justify-center p-4">
                                <h3 className="font-semibold text-white">{category.name}</h3>
                            </CardFooter>
                        </Card>
                    </a>
                ))}
            </div>
        </div>
    );
};

const HowItWorksPage = () => {
    const buyerSteps = [
        { title: "Cadastre-se", description: "Crie sua conta gratuitamente para começar a participar dos leilões." },
        { title: "Explore", description: "Navegue por nossas categorias e encontre itens de seu interesse." },
        { title: "Dê seu Lance", description: "Encontrou algo que gostou? Digite o valor e confirme seu lance." },
        { title: "Arremate", description: "Se o seu lance for o maior ao final, parabéns! O item é seu." },
    ];
    const sellerSteps = [
        { title: "Anuncie seu Item", description: "Preencha os detalhes, como título, descrição, lance inicial e fotos." },
        { title: "Acompanhe", description: "Veja os lances sendo feitos em tempo real na página do seu produto." },
        { title: "Venda Concluída", description: "Ao final do leilão, o maior lance arremata o item." },
        { title: "Receba", description: "Após a confirmação do pagamento, o valor será transferido para você." },
    ];

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-center text-4xl font-bold mb-4">Como Funciona</h1>
            <p className="text-center text-slate-400 mb-12">Simples, rápido e seguro. Veja como é fácil comprar e vender conosco.</p>

            <div className="mb-16">
                <h2 className="text-2xl font-bold mb-6 text-blue-400">Para Compradores</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {buyerSteps.map((step, index) => (
                        <Card key={index} className="text-center">
                            <CardHeader>
                                <CardTitle className="text-xl">{step.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-300">{step.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-bold mb-6 text-green-400">Para Vendedores</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {sellerSteps.map((step, index) => (
                        <Card key={index} className="text-center">
                            <CardHeader>
                                <CardTitle className="text-xl">{step.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-300">{step.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
};


const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        const user = login(email, password);
        if (user) {
            window.location.hash = '/';
        } else {
            setError('Email ou senha inválidos.');
        }
    };

    return (
        <div className="flex justify-center items-center">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-center text-2xl">Bem-vindo de volta!</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="email">Email</label>
                            <Input id="email" type="email" placeholder="seuemail@exemplo.com" value={email} onChange={e => setEmail(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="password">Senha</label>
                            <Input id="password" type="password" placeholder="Sua senha" value={password} onChange={e => setPassword(e.target.value)} required />
                        </div>
                        {error && <p className="text-red-400 text-sm">{error}</p>}
                        <Button type="submit" className="w-full" variant="primary">Entrar</Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center">
                    <p className="text-sm text-slate-400">Não tem uma conta? <a href="#/cadastro" className="text-blue-400 hover:underline">Cadastre-se</a></p>
                </CardFooter>
            </Card>
        </div>
    );
};

const RegisterPage = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [cpf, setCpf] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const { register } = useAuth();

    const handleCpfChange = (e) => {
        setCpf(formatCPF(e.target.value));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (!validateEmail(email)) {
            setError('Por favor, insira um e-mail válido.');
            return;
        }
        if (!validateCPF(cpf)) {
            setError('CPF inválido. Verifique o número digitado.');
            return;
        }
        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }
        
        try {
            register(name, email, password, cpf);
            alert('Cadastro realizado com sucesso!');
            window.location.hash = '/login';
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="flex justify-center items-center">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-center text-2xl">Crie sua conta</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="name">Nome Completo</label>
                            <Input id="name" type="text" value={name} onChange={e => setName(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="email">Email</label>
                            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="cpf">CPF</label>
                            <Input id="cpf" type="text" value={cpf} onChange={handleCpfChange} placeholder="000.000.000-00" required />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="password">Senha</label>
                            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="confirmPassword">Confirme a Senha</label>
                            <Input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                        </div>
                        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                        <Button type="submit" className="w-full" variant="primary">Criar Conta</Button>
                    </form>
                </CardContent>
                 <CardFooter className="justify-center">
                    <p className="text-sm text-slate-400">Já tem uma conta? <a href="#/login" className="text-blue-400 hover:underline">Faça o login</a></p>
                </CardFooter>
            </Card>
        </div>
    );
};

const AnnounceItemPage = () => {
    const { addAuction, categories } = useAuctions();
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startBid, setStartBid] = useState('');
    const [increment, setIncrement] = useState('');
    const [category, setCategory] = useState('');
    const [endDate, setEndDate] = useState('');
    const [images, setImages] = useState([]);
    // Novos campos de detalhes
    const [condition, setCondition] = useState('');
    const [year, setYear] = useState('');
    const [dimensions, setDimensions] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!user) {
            alert("Você precisa estar logado para anunciar um item.");
            window.location.hash = '/login';
            return;
        }

        const newAuctionData = {
            title,
            description,
            category,
            images: images.length > 0 ? images : ['https://placehold.co/600x400/282c39/FFF?text=Imagem'],
            details: {
                Condição: condition,
                Ano: year,
                Dimensões: dimensions,
            },
            auctionInfo: {
                currentBid: parseFloat(startBid),
                startBid: parseFloat(startBid),
                increment: parseFloat(increment),
            },
            endDate,
            bidHistory: [],
            sellerInfo: {
                id: user.id,
                name: user.name,
                avatar: user.avatar,
                memberSince: user.memberSince,
            },
        };

        addAuction(newAuctionData);
        alert('Leilão criado com sucesso!');
        window.location.hash = '/';
    };
    
    const handleImageChange = (e) => {
        const files = Array.from(e.target.files).slice(0, 9);
        const imagePromises = files.map(file => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        });
        Promise.all(imagePromises).then(setImages);
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Anunciar Novo Item</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label htmlFor="title">Título do Item</label>
                    <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required />
                </div>
                <div className="space-y-2">
                    <label htmlFor="description">Descrição Detalhada</label>
                    <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} required className="w-full h-24 p-3 rounded-md bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label htmlFor="condition">Condição</label>
                        <Input id="condition" value={condition} onChange={e => setCondition(e.target.value)} placeholder="Ex: Excelente, Usado" required />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="year">Ano</label>
                        <Input id="year" type="number" value={year} onChange={e => setYear(e.target.value)} placeholder="Ex: 2023" />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="dimensions">Dimensões</label>
                        <Input id="dimensions" value={dimensions} onChange={e => setDimensions(e.target.value)} placeholder="Ex: 60 x 80 cm" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label htmlFor="startBid">Lance Inicial (R$)</label>
                        <Input id="startBid" type="number" step="0.01" value={startBid} onChange={e => setStartBid(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="increment">Incremento (R$)</label>
                        <Input id="increment" type="number" step="0.01" value={increment} onChange={e => setIncrement(e.target.value)} required />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label htmlFor="category">Categoria</label>
                        <select id="category" value={category} onChange={e => setCategory(e.target.value)} required className="w-full h-12 px-3 rounded-md bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
                            <option value="">Selecione...</option>
                            {initialCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="endDate">Data de Término</label>
                        <Input id="endDate" type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} required />
                    </div>
                </div>
                <div className="space-y-2">
                    <label htmlFor="images">Imagens (até 9)</label>
                    <Input id="images" type="file" accept="image/*" multiple onChange={handleImageChange} />
                </div>
                {images.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                        {images.map((img, index) => <img key={index} src={img} className="w-full h-24 object-cover rounded-md" />)}
                    </div>
                )}
                <Button type="submit" variant="primary" className="w-full h-12">Criar Leilão</Button>
            </form>
        </div>
    );
};

const MyAccountPage = () => {
    const { user, updateUser } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(user?.avatar);

    if (!user) {
        window.location.hash = '/login';
        return null;
    }

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const updatedData = { name };
        if (avatarFile) {
            const reader = new FileReader();
            reader.onloadend = () => {
                updatedData.avatar = reader.result;
                updateUser(updatedData);
                alert("Perfil atualizado com sucesso!");
            };
            reader.readAsDataURL(avatarFile);
        } else {
            updateUser(updatedData);
            alert("Perfil atualizado com sucesso!");
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Minha Conta</h1>
            <Card className="p-6 flex items-center gap-6 mb-8">
                <img src={user.avatar} alt="Avatar" className="w-32 h-32 rounded-full object-cover border-4 border-slate-700" />
                <div>
                    <p className="text-2xl font-bold">{user.name}</p>
                    <p className="text-slate-400">{user.email}</p>
                    <p className="text-slate-400">CPF: {user.cpf}</p>
                    <p className="text-slate-400 text-sm">Membro desde: {user.memberSince}</p>
                </div>
            </Card>

            <h2 className="text-2xl font-bold mb-4">Editar Perfil</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label htmlFor="edit-name">Nome</label>
                    <Input id="edit-name" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <label htmlFor="edit-avatar">Alterar Foto de Perfil</label>
                    <Input id="edit-avatar" type="file" accept="image/*" onChange={handleAvatarChange} />
                </div>
                {avatarPreview && <img src={avatarPreview} className="w-24 h-24 rounded-full object-cover" />}
                <Button type="submit" variant="primary">Salvar Alterações</Button>
            </form>
        </div>
    );
};

const WatchlistPage = () => {
    const { auctions, watchlist } = useAuctions();
    const watchedItems = auctions.filter(auction => watchlist.includes(auction.id));

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Lista de Observação</h1>
            <div className="space-y-4">
                {watchedItems.length > 0 ? (
                    watchedItems.map(item => (
                        <a href={`#/produto/${item.id}`} key={item.id} className="block">
                            <Card className="p-4 flex items-center gap-4 hover:bg-slate-800 transition-colors">
                                <img src={item.images[0]} alt={item.title} className="w-24 h-24 object-cover rounded-md" />
                                <div className="flex-grow">
                                    <h3 className="font-semibold text-lg">{item.title}</h3>
                                    <p className="text-sm text-slate-400">{item.description}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-slate-400">Lance Atual</p>
                                    <p className="font-bold text-lg">{formatCurrency(item.auctionInfo.currentBid)}</p>
                                </div>
                            </Card>
                        </a>
                    ))
                ) : (
                    <p className="text-center text-slate-400 py-8">Sua lista de observação está vazia.</p>
                )}
            </div>
        </div>
    );
};

const MyAuctionsPage = () => {
    const { auctions, deleteAuction } = useAuctions();
    const { user } = useAuth();
    
    if(!user) {
        window.location.hash = '/login';
        return null;
    }

    const myAuctions = auctions.filter(auction => auction.sellerInfo.id === user.id);

    const handleDelete = (auctionId, e) => {
        e.preventDefault(); 
        e.stopPropagation();
        if (window.confirm("Tem certeza que deseja excluir este leilão? Esta ação não pode ser desfeita.")) {
            deleteAuction(auctionId);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Meus Leilões</h1>
            <div className="space-y-4">
                {myAuctions.length > 0 ? (
                    myAuctions.map(item => (
                         <div key={item.id} className="relative group">
                            <a href={`#/produto/${item.id}`} className="block">
                                <Card className="p-4 flex items-center gap-4 hover:bg-slate-800 transition-colors">
                                    <img src={item.images[0]} alt={item.title} className="w-24 h-24 object-cover rounded-md" />
                                    <div className="flex-grow">
                                        <h3 className="font-semibold text-lg">{item.title}</h3>
                                        <p className="text-sm text-slate-400">{item.description}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-slate-400">Lance Atual</p>
                                        <p className="font-bold text-lg">{formatCurrency(item.auctionInfo.currentBid)}</p>
                                    </div>
                                </Card>
                            </a>
                            <Button 
                                variant="destructive" 
                                size="sm" 
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => handleDelete(item.id, e)}
                            >
                                Excluir
                            </Button>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-slate-400 py-8">Você ainda não anunciou nenhum item.</p>
                )}
            </div>
        </div>
    );
};


// --- PRODUCT PAGE SECTIONS (From original project) ---
// Seções da página de produto, agora usando Context para dados.

const ArtworkTitleSection = ({ title }) => (
    <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{title}</h1>
);

// EDIT: Componente da galeria de imagens foi refeito para ser mais interativo
const ImageGallerySection = ({ images, title }) => {
    const [selectedImage, setSelectedImage] = useState(images[0]);

    if (!images || images.length === 0) {
        return <div>Nenhuma imagem disponível.</div>;
    }

    return (
        <div>
            <div className="mb-4">
                <img 
                    src={selectedImage} 
                    alt={`Imagem principal de ${title}`} 
                    className="w-full h-auto max-h-[500px] object-contain rounded-lg shadow-lg" 
                />
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                {images.map((src, index) => (
                    <button 
                        key={index} 
                        onClick={() => setSelectedImage(src)}
                        className={cn(
                            "rounded-lg overflow-hidden border-2 transition-all",
                            selectedImage === src ? "border-blue-500" : "border-transparent hover:border-blue-400"
                        )}
                    >
                        <img 
                            src={src} 
                            alt={`${title} - miniatura ${index + 1}`} 
                            className="w-full h-full object-cover aspect-square" 
                        />
                    </button>
                ))}
            </div>
        </div>
    );
};

const AuctionDetailsSection = ({ auctionInfo, endDate, onBid, isWatched, onToggleWatchlist, bidHistory }) => {
    const { currentBid, increment } = auctionInfo;
    const minBid = currentBid + increment;
    const [bidAmount, setBidAmount] = useState(minBid);
    const countdown = useCountdown(endDate);
    const { user } = useAuth();
    const winner = bidHistory && bidHistory.length > 0 ? bidHistory[0].user : null;

    useEffect(() => {
        setBidAmount(currentBid + increment);
    }, [currentBid, increment]);
    
    const handleBidSubmit = (e) => {
        e.preventDefault();
        if (!user) {
            alert("Você precisa estar logado para dar um lance.");
            window.location.hash = '/login';
            return;
        }
        if (bidAmount < minBid) {
            alert(`O lance mínimo é de ${formatCurrency(minBid)}`);
            return;
        }
        onBid(bidAmount);
    };

    return (
        <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Detalhes do Leilão</h2>
            <div className="grid grid-cols-2 gap-4 mb-6 text-center">
                <div>
                    <p className="text-sm text-slate-400">Lance Atual</p>
                    <p className="text-2xl font-bold">{formatCurrency(currentBid)}</p>
                </div>
                <div>
                    <p className="text-sm text-slate-400">Lance Mínimo</p>
                    <p className="text-2xl font-bold">{formatCurrency(minBid)}</p>
                </div>
            </div>
            
            <div className="mb-6 text-center">
                {countdown.isFinished ? (
                    <div>
                        <p className="text-2xl font-bold text-red-500 mb-2">Leilão Encerrado</p>
                        {winner ? (
                            <p className="text-lg">Vencedor: <span className="font-bold text-green-400">{winner}</span></p>
                        ) : (
                            <p className="text-slate-400">Leilão encerrado sem lances.</p>
                        )}
                    </div>
                ) : (
                    <>
                        <p className="text-sm text-slate-400 mb-2">Tempo Restante</p>
                        <div className="flex justify-center gap-2 md:gap-4">
                            <div className="bg-slate-800 p-3 rounded-lg min-w-[70px]"><span className="text-2xl font-bold">{String(countdown.days).padStart(2, '0')}</span><p className="text-xs text-slate-400">Dias</p></div>
                            <div className="bg-slate-800 p-3 rounded-lg min-w-[70px]"><span className="text-2xl font-bold">{String(countdown.hours).padStart(2, '0')}</span><p className="text-xs text-slate-400">Horas</p></div>
                            <div className="bg-slate-800 p-3 rounded-lg min-w-[70px]"><span className="text-2xl font-bold">{String(countdown.minutes).padStart(2, '0')}</span><p className="text-xs text-slate-400">Min</p></div>
                            <div className="bg-slate-800 p-3 rounded-lg min-w-[70px]"><span className="text-2xl font-bold">{String(countdown.seconds).padStart(2, '0')}</span><p className="text-xs text-slate-400">Seg</p></div>
                        </div>
                    </>
                )}
            </div>

            {!countdown.isFinished && (
                <form onSubmit={handleBidSubmit} className="flex flex-col items-center gap-4">
                     <div className="flex items-center gap-2">
                        <Button type="button" onClick={() => setBidAmount(prev => Math.max(minBid, prev - increment))}>-</Button>
                        <Input type="number" value={bidAmount} onChange={e => setBidAmount(parseFloat(e.target.value))} className="w-32 text-center" />
                        <Button type="button" onClick={() => setBidAmount(prev => prev + increment)}>+</Button>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                        <Button type="submit" variant="primary" size="lg" className="w-full">Fazer Lance</Button>
                        <Button type="button" variant={isWatched ? 'destructive' : 'secondary'} size="lg" onClick={onToggleWatchlist} className="w-full">
                            <HeartIcon className="mr-2" /> {isWatched ? 'Remover' : 'Observar'}
                        </Button>
                    </div>
                </form>
            )}
        </Card>
    );
};

const ItemDetailsSection = ({ details }) => {
    if (!details || Object.keys(details).length === 0) {
        return null; 
    }

    return (
        <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Detalhes do Item</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(details).map(([key, value]) => (
                    <div key={key}>
                        <p className="text-sm text-slate-400">{key}</p>
                        <p className="font-semibold">{value}</p>
                    </div>
                ))}
            </div>
        </Card>
    );
};


const BiddingHistorySection = ({ history }) => (
    <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Histórico de Lances</h2>
        {history.length > 0 ? (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead className="text-right">Lance</TableHead>
                        <TableHead className="text-right">Data</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {history.map((bid, index) => (
                        <TableRow key={index}>
                            <TableCell className="font-medium">{bid.user}</TableCell>
                            <TableCell className="text-right">{formatCurrency(bid.amount)}</TableCell>
                            <TableCell className="text-right text-slate-400">{bid.date}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        ) : (
            <p className="text-slate-400 text-center py-4">Seja o primeiro a dar um lance!</p>
        )}
    </Card>
);

const SellerInformationSection = ({ seller }) => (
    <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Informações do Vendedor</h2>
        <div className="flex items-center gap-4">
            <img src={seller.avatar} alt={`Avatar de ${seller.name}`} className="w-16 h-16 rounded-full object-cover" />
            <div>
                <p className="font-semibold text-lg">{seller.name}</p>
                <p className="text-sm text-slate-400">{seller.memberSince}</p>
            </div>
        </div>
    </Card>
);

const ProductPage = ({ routeId }) => {
    const { getAuctionById, placeBid, watchlist, toggleWatchlist } = useAuctions();
    const { user } = useAuth();
    
    const id = routeId;

    if (!id) {
        return <div>Carregando...</div>;
    }
    
    const product = getAuctionById(id);

    if (!product) {
        return <div>Leilão não encontrado.</div>;
    }

    const handlePlaceBid = (amount) => {
        placeBid(product.id, amount, user);
    };
    
    const handleToggleWatchlist = () => {
        toggleWatchlist(product.id);
    };

    return (
        <div className="max-w-7xl mx-auto">
            <ArtworkTitleSection title={product.title} />
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-8">
                <div className="lg:col-span-3">
                    <ImageGallerySection images={product.images} title={product.title} />
                </div>
                <div className="lg:col-span-2">
                    <AuctionDetailsSection 
                        auctionInfo={product.auctionInfo} 
                        endDate={product.endDate} 
                        onBid={handlePlaceBid}
                        isWatched={watchlist.includes(product.id)}
                        onToggleWatchlist={handleToggleWatchlist}
                        bidHistory={product.bidHistory}
                    />
                </div>
            </div>
            {/* EDIT: As seções abaixo agora formam uma nova grade para melhor organização */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <ItemDetailsSection details={product.details} />
                <SellerInformationSection seller={product.sellerInfo} />
                <div className="md:col-span-2">
                    <BiddingHistorySection history={product.bidHistory} />
                </div>
            </div>
        </div>
    );
};


// --- APP ROUTER ---
// Componente principal que gerencia as rotas da aplicação

const App = () => {
    const [route, setRoute] = useState(window.location.hash);

    useEffect(() => {
        const handleHashChange = () => {
            setRoute(window.location.hash);
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    let PageComponent;
    const path = route.split('?')[0]; // Ignora query params para roteamento
    const params = new URLSearchParams(route.split('?')[1]);
    const pathParts = path.split('/');

    switch (pathParts[1]) {
        case 'produto':
            PageComponent = <ProductPage routeId={pathParts[2]} />;
            break;
        case 'categorias':
            PageComponent = <CategoriesPage />;
            break;
        case 'categoria':
            PageComponent = <AuctionListPage categoryId={pathParts[2]} />;
            break;
        case 'leiloes':
            PageComponent = <AuctionListPage searchQuery={params.get('q')} />;
            break;
        case 'como-funciona':
            PageComponent = <HowItWorksPage />;
            break;
        case 'login':
            PageComponent = <LoginPage />;
            break;
        case 'cadastro':
            PageComponent = <RegisterPage />;
            break;
        case 'anunciar-item':
            PageComponent = <AnnounceItemPage />;
            break;
        case 'minha-conta':
            PageComponent = <MyAccountPage />;
            break;
        case 'lista-observacao':
            PageComponent = <WatchlistPage />;
            break;
        case 'meus-leiloes':
            PageComponent = <MyAuctionsPage />;
            break;
        default:
            PageComponent = <AuctionListPage />;
    }

    return (
        <AuthProvider>
            <AuctionProvider>
                <AppLayout>
                    {PageComponent}
                </AppLayout>
            </AuctionProvider>
        </AuthProvider>
    );
};

export default App;
