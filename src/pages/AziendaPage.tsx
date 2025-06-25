import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ConnectButton,
  useActiveAccount,
  useReadContract,
  useSendAndConfirmTransaction,
} from "thirdweb/react";
import {
  createThirdwebClient,
  getContract,
  prepareContractCall,
  readContract,
} from "thirdweb";
import { polygon } from "thirdweb/chains";
import { inAppWallet } from "thirdweb/wallets";
import { supplyChainABI as abi } from "../abi/contractABI";
import "../App.css";
import TransactionStatusModal from "../components/TransactionStatusModal";

// --- INIZIALIZZAZIONE CLIENT E CONTRATTO (INVARIATO) ---
const client = createThirdwebClient({
  clientId: "e40dfd747fabedf48c5837fb79caf2eb",
});
const contract = getContract({
  client,
  chain: polygon,
  address: "0x4a866C3A071816E3186e18cbE99a3339f4571302",
});

// --- COMPONENTI STILISTICI E DI UI (INVARIATI) ---
const AziendaPageStyles = () => (
  <style>{`
    /* ... stili CSS invariati ... */
  `}</style>
);
const RegistrationForm = () => (
  <div className="card">
    <h3>Benvenuto su Easy Chain!</h3>
    <p>
      Il tuo account non è ancora attivo. Compila il form di registrazione per
      inviare una richiesta di attivazione.
    </p>
  </div>
);
interface BatchData {
  id: string; // Usiamo batchId come stringa per la chiave React
  batchId: bigint;
  name: string;
  description: string;
  date: string;
  location: string;
  isClosed: boolean;
}
const RefreshIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="currentColor"
    viewBox="0 0 16 16"
  >
    <path
      fillRule="evenodd"
      d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"
    />
    <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466" />
  </svg>
);

// --- COMPONENTE BATCHROW (INVARIATO) ---
const BatchRow = ({ batch, localId }: { batch: BatchData; localId: number }) => {
  // ... logica componente BatchRow invariata ...
};

// --- COMPONENTE BATCHTABLE (INVARIATO) ---
const BatchTable = ({ batches, nameFilter, setNameFilter, locationFilter, setLocationFilter, statusFilter, setStatusFilter }: any) => {
  // ... logica componente BatchTable invariata ...
};

// --- COMPONENTE DASHBOARDHEADER (MODIFICATO PER NUOVO STATO REFRESH) ---
const DashboardHeader = ({
  contributorInfo,
  onNewInscriptionClick,
  onRefreshClick,
  isRefreshDisabled, // Nome prop modificato per chiarezza
  refreshTooltip,
}: {
  contributorInfo: readonly [string, bigint, boolean];
  onNewInscriptionClick: () => void;
  onRefreshClick: () => void;
  isRefreshDisabled: boolean;
  refreshTooltip: string;
}) => {
  const companyName = contributorInfo[0] || "Azienda";
  const credits = contributorInfo[1].toString();
  return (
    <div className="dashboard-header-card">
      <div className="dashboard-header-info">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <h2 className="company-name-header">{companyName}</h2>
          <button
            onClick={onRefreshClick}
            disabled={isRefreshDisabled}
            title={refreshTooltip}
            className="web3-button"
            style={{
              padding: "0.5rem",
              backgroundColor: isRefreshDisabled ? "#495057" : "#6c757d",
              cursor: isRefreshDisabled ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "40px",
              height: "40px",
            }}
          >
            <RefreshIcon />
          </button>
        </div>
        <div className="company-status-container">
          <div className="status-item">
            <span>
              Crediti Rimanenti: <strong>{credits}</strong>
            </span>
          </div>
          <div className="status-item">
            <span>
              Stato: <strong>ATTIVO</strong>
            </span>
            <span className="status-icon">✅</span>
          </div>
        </div>
      </div>
      <div className="header-actions">
        <button className="web3-button large" onClick={onNewInscriptionClick}>
          Nuova Iscrizione
        </button>
      </div>
    </div>
  );
};

const getInitialFormData = () => ({
  name: "",
  description: "",
  date: "",
  location: "",
});
const truncateText = (text: string, maxLength: number) => {
  if (!text) return text;
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};

// --- COMPONENTE PRINCIPALE ---
export default function AziendaPage() {
  const account = useActiveAccount();
  const {
    data: contributorData,
    isLoading: isStatusLoading,
    refetch: refetchContributorInfo,
    isError,
  } = useReadContract({
    contract,
    method: "function getContributorInfo(address) view returns (string, uint256, bool)",
    params: account ? [account.address] : undefined,
    queryOptions: { enabled: !!account },
  });
  const prevAccountRef = useRef(account?.address);

  const { mutate: sendAndConfirmTransaction, isPending } =
    useSendAndConfirmTransaction();

  const [modal, setModal] = useState<"init" | null>(null);
  const [formData, setFormData] = useState(getInitialFormData());
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // La logica del file rimane lato client
  const [txResult, setTxResult] = useState<{
    status: "success" | "error" | "loading";
    message: string;
  } | null>(null);

  // STATI PER I DATI ON-CHAIN
  const [allBatches, setAllBatches] = useState<BatchData[]>([]);
  const [filteredBatches, setFilteredBatches] = useState<BatchData[]>([]);
  const [isLoadingBatches, setIsLoadingBatches] = useState(true); // Unico stato di caricamento per i dati
  const [loadingMessage, setLoadingMessage] = useState("");
  
  // STATI PER FILTRI E MODALE (INVARIATI)
  const [currentStep, setCurrentStep] = useState(1);
  const [nameFilter, setNameFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // *** LOGICA MODIFICATA: Funzione per caricare le iscrizioni direttamente dalla Blockchain ***
  const fetchBatchesOnChain = async () => {
    if (!account?.address) return;

    setIsLoadingBatches(true);
    setTxResult(null); // Pulisce messaggi di stato precedenti

    try {
      // 1. Ottiene l'array degli ID delle iscrizioni (batch) associate all'indirizzo
      const onChainIds = (await readContract({
        contract,
        abi,
        method: "function getBatchesByContributor(address) view returns (uint256[])",
        params: [account.address],
      })) as bigint[];

      if (onChainIds.length === 0) {
        setAllBatches([]); // Nessuna iscrizione trovata
        return;
      }
      
      // 2. Per ogni ID, recupera le informazioni dettagliate
      const batchPromises = onChainIds.map(async (batchId) => {
        const info = await readContract({
          contract,
          abi,
          // La funzione restituisce una tupla con i dati del batch
          method: "function getBatchInfo(uint256) view returns (uint256, address, string, string, string, string, string, string, bool)",
          params: [batchId],
        });

        // 3. Mappa la tupla restituita in un oggetto BatchData strutturato
        return {
          id: batchId.toString(), // ID univoco per la key di React
          batchId: batchId,
          // I campi sono indicizzati in base all'ordine di ritorno della funzione dello smart contract
          name: info[3],
          description: info[4],
          date: info[5],
          location: info[6],
          isClosed: info[8], // L'ultimo valore booleano indica se è chiuso
        };
      });

      // Attende che tutte le richieste di informazioni siano completate
      const batchesData = await Promise.all(batchPromises);

      // Ordina i risultati dal più recente al più vecchio basandosi sul batchId
      const sortedBatches = batchesData.sort((a, b) => Number(b.batchId - a.batchId));
      
      setAllBatches(sortedBatches);

    } catch (error: any) {
      console.error("Errore nel caricare i lotti dalla blockchain:", error);
      setTxResult({
        status: "error",
        message: `Errore caricamento dati on-chain: ${error.message}`,
      });
      setAllBatches([]);
    } finally {
      // 4. In ogni caso, imposta lo stato di caricamento a false
      setIsLoadingBatches(false);
    }
  };

  // *** LOGICA MODIFICATA: useEffect per caricare i dati all'accesso ***
  useEffect(() => {
    // Se un account è connesso, carica le sue iscrizioni dalla blockchain
    if (account?.address) {
      fetchBatchesOnChain();
    }
    
    // Se l'account cambia, forza un aggiornamento dei dati del contributore
    if (account?.address && prevAccountRef.current !== account.address) {
        refetchContributorInfo();
    }

    // Se l'utente si disconnette, reindirizza alla home
    if (!account && prevAccountRef.current) {
      window.location.href = "/";
    }

    prevAccountRef.current = account?.address;
  }, [account]); // Questo hook si attiva solo quando l'oggetto `account` cambia

  
  // useEffect per i filtri (INVARIATO)
  useEffect(() => {
    let tempBatches = [...allBatches];
    if (nameFilter) {
      tempBatches = tempBatches.filter((b) =>
        b.name.toLowerCase().includes(nameFilter.toLowerCase())
      );
    }
    if (locationFilter) {
      tempBatches = tempBatches.filter((b) =>
        b.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }
    if (statusFilter !== "all") {
      const isOpen = statusFilter === "open";
      tempBatches = tempBatches.filter((b) => !b.isClosed === isOpen);
    }
    setFilteredBatches(tempBatches);
  }, [nameFilter, locationFilter, statusFilter, allBatches]);


  // Gestione input modale e file (INVARIATO)
  const handleModalInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(e.target.files?.[0] || null);
  };

  // *** LOGICA MODIFICATA: Gestione creazione nuova iscrizione (batch) ***
  const handleInitializeBatch = async () => {
    if (!formData.name.trim()) {
      setTxResult({ status: "error", message: "Il campo Nome è obbligatorio." });
      return;
    }
    setLoadingMessage("Preparazione transazione...");
    
    // La logica di upload del file (se presente) non cambia, ma ora l'hash viene solo salvato on-chain
    let imageIpfsHash = "N/A"; 
    if (selectedFile) {
        // ... La tua logica di upload file su IPFS va qui ...
        // Esempio: imageIpfsHash = await uploadToIpfs(selectedFile);
    }

    setLoadingMessage("Transazione in corso, attendi la conferma...");
    
    const transaction = prepareContractCall({
      contract,
      abi,
      method: "function initializeBatch(string,string,string,string,string)",
      params: [
        formData.name,
        formData.description,
        formData.date,
        formData.location,
        imageIpfsHash,
      ],
    });

    sendAndConfirmTransaction(transaction, {
      onSuccess: async () => {
        setLoadingMessage("Aggiornamento dati...");
        
        // ** MODIFICA CHIAVE **: Non c'è più bisogno di salvare su un DB.
        // Semplicemente, ricarichiamo tutti i dati dalla blockchain per avere la lista aggiornata.
        // Ricarichiamo anche i dati del contributore per aggiornare i crediti.
        try {
          await Promise.all([fetchBatchesOnChain(), refetchContributorInfo()]);
          setTxResult({
            status: "success",
            message: "Iscrizione creata con successo sulla blockchain!",
          });
        } catch (error: any) {
           setTxResult({
            status: "error",
            message: `Transazione OK, ma errore ricaricando i dati: ${error.message}`,
          });
        } finally {
            setLoadingMessage("");
            handleCloseModal(); // Chiude la modale principale
        }
      },
      onError: (err) => {
        setTxResult({
          status: "error",
          message: err.message.toLowerCase().includes("insufficient funds")
            ? "Crediti Insufficienti"
            : `Errore transazione: ${err.message}`,
        });
        setLoadingMessage("");
      },
    });
  };

  // Funzioni di gestione modale (INVARIATE)
  const openModal = () => {
    setFormData(getInitialFormData());
    setSelectedFile(null);
    setCurrentStep(1);
    setTxResult(null);
    setModal("init");
  };
  const handleCloseModal = () => setModal(null);
  const handleNextStep = () => { /* ... */ };
  const handlePrevStep = () => { /* ... */ };


  // Render del componente se l'utente non è loggato (INVARIATO)
  if (!account) {
    return (
      <div className="login-container">
        {/* ... */}
      </div>
    );
  }

  // Render del contenuto della dashboard
  const renderDashboardContent = () => {
    if (isStatusLoading) return <p style={{ textAlign: "center", marginTop: "4rem" }}>Verifica stato account...</p>;
    if (isError || !contributorData) return <p style={{ textAlign: "center", marginTop: "4rem", color: "red" }}>Errore nel recuperare i dati dell'account. Riprova.</p>;
    if (!contributorData[2]) return <RegistrationForm />;
    
    return (
      <>
        <DashboardHeader
          contributorInfo={contributorData}
          onNewInscriptionClick={openModal}
          // ** MODIFICA **: Il pulsante refresh ora chiama direttamente la funzione di fetch on-chain
          onRefreshClick={fetchBatchesOnChain}
          isRefreshDisabled={isLoadingBatches} // Il pulsante si disabilita mentre si caricano i dati
          refreshTooltip={
            isLoadingBatches
              ? "Aggiornamento in corso..."
              : "Aggiorna i dati dalla blockchain"
          }
        />
        {isLoadingBatches ? (
          <p style={{ textAlign: "center", marginTop: "2rem" }}>
            Caricamento iscrizioni dalla blockchain...
          </p>
        ) : (
          <BatchTable
            batches={filteredBatches}
            nameFilter={nameFilter}
            setNameFilter={setNameFilter}
            locationFilter={locationFilter}
            setLocationFilter={setLocationFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />
        )}
      </>
    );
  };

  const isProcessing = loadingMessage !== "" || isPending;
  const today = new Date().toISOString().split("T")[0];
  const helpTextStyle = { /* ... */ };

  return (
    <div className="app-container-full">
      <AziendaPageStyles />
      <header className="main-header-bar">
        {/* ... Header invariato ... */}
      </header>
      <main className="main-content-full">{renderDashboardContent()}</main>

      {/* --- MODALE E POPUP DI STATO (Logica interna invariata, ma messaggi aggiornati) --- */}
      {modal === "init" && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          {/* ... Contenuto della modale invariato ... */}
        </div>
      )}

      {/* Popup per transazioni in corso */}
      {isProcessing && (
        <TransactionStatusModal
          status={"loading"}
          message={loadingMessage}
          onClose={() => {}}
        />
      )}
      
      {/* Popup per risultato transazione o errori di fetch */}
      {txResult && (
        <TransactionStatusModal
          status={txResult.status}
          message={txResult.message}
          onClose={() => {
             if (txResult.status === "success") {
                // Non chiudiamo più la modale principale qui,
                // viene già gestito nel blocco onSuccess/onError della transazione.
             }
             setTxResult(null); // Chiude solo questo popup
          }}
        />
      )}
    </div>
  );
}