const {  programs } = require('@metaplex/js')
const { PublicKey, Connection } = require('@solana/web3.js')
const { web3 } = require('@project-serum/anchor')

const {
    metadata: { MetadataData },
    TokenAccount,
} = programs;

const getMetadata = async (
    //userWallet: web3.PublicKey
) => {

    //Establishes Connection
    const connection = new Connection(
        // cheap mainnet quiknode
        //"https://withered-delicate-bird.solana-mainnet.quiknode.pro/59cfd581e09e0c25b375a642f91a4db010cf27f6/"
        // cheap devnet quiknode
        "https://rough-late-haze.solana-devnet.quiknode.pro/9fe6af89a46090ee7d3e295e7087eb63c586ba94/"
        //"https://api.devnet.solana.com/"
    );
    // Gets array of token account objects
    const accounts = await TokenAccount.getTokenAccountsByOwner(connection, userWallet);

    // Filter accounts with a positive balance
    const accountsWithAmount = accounts
      .map(({ data }) => data)
      .filter(({ amount }) => amount?.toNumber() > 0);

    // Fetch mint addresses within token account
    let nftMintAddresses = accountsWithAmount.map(({ mint }) => mint);

    let nftMetadataAddresses = [];
    let nftAcInfo;

    // Loop thru array of token mint addresses
    for(let i = 0; i < nftMintAddresses.length; i++) {
        // Gets PDA (metadata address) for each token account
        nftMetadataAddresses[i] = await fetchMetadata(nftMintAddresses[i]);

        // Gets Account object from PDA (metadata address)
        // getMultipleAccountsInfo handles an array of Accounts
        nftAcInfo = await connection.getMultipleAccountsInfo(
            nftMetadataAddresses,
            "processed"
        );
    }

    // nftAccountInfo stores metadata account -> object with attributes
    let nftAccountInfo = nftAcInfo?.map(
        (info) => info?.data !== undefined ? MetadataData.deserialize(info?.data) : undefined
    ).filter(function( element ) {
        return element !== undefined;
    });
    nftAccountInfo?.forEach((accountinfo)=>{
        console.log(accountinfo)
    })
    /*
        Isolate specific attributes within nftAccountInfo 
        By referencing any of these attributes

        METADATA:
        key: MetadataKey;
        updateAuthority: StringPublicKey;
        mint: StringPublicKey;
        data: MetadataDataData;
        primarySaleHappened: boolean;
        isMutable: boolean;
        editionNonce: number | null;

        DATA:
        name: String,
        symbol: String,
        uri: String, // points to metadata JSON
        seller_fee_basis_points: u16,
        creators: Option<Vec<Creator>>,
}
    */

    /*
       let metadataUri = nftAccountInfo[k].data.uri
       fetch(metadataUri) -> returns JSON
       store in nft.json
    */
    let accountList = []
    if (nftAccountInfo) {
        for (let k = 0; k < nftAccountInfo.length; k++) {
            // nftAccountInfo = metadata account
            accountList[k] = new web3.PublicKey(nftAccountInfo[k].updateAuthority)
            console.log('updateAuth: ', accountList[k])
        }
    } 
    //console.log(accountList)

    return accountList;
}

const fetchMetadata = async (
    //nftMintKey: PublicKey
    nftMintKey
) => {
    const metadataBuffer = Buffer.from('metadata');
    const metadataProgramIdPublicKey = new PublicKey(
        'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'
    );

    // Fetches metadata account from PDA
    const metadataAccount = (
        await PublicKey.findProgramAddress(
            [
                metadataBuffer,
                metadataProgramIdPublicKey.toBuffer(),
                nftMintKey.toBuffer(),
            ],
            metadataProgramIdPublicKey
        )
    )[0];

    return metadataAccount;
}
//module.exports = {getMetadata}
getMetadata()