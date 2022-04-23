import HomeViewModel from "../ViewModels/HomeViewModel";
import {SyntheticEvent, useEffect, useState} from "react";
import axios from "axios";
import {Item, SubItem} from "../Global/Types";
import AuthenticationViewModel from "../ViewModels/AuthenticationViewModel";
import {aesDecryptString, aesEncryptString} from "../Global/Cryptography";

export default function HomeViewController(props: {authViewModel?: AuthenticationViewModel}) {
    const [isEditing, setIsEditing] = useState(-1);
    const [selectedItemType, setSelectedItemType] = useState(0);
    const [formData, setFormData] = useState({});
    const [hasPanelOpen, setHasPanelOpen] = useState(false);
    const [vaultItems, setVaultItems] = useState<Item[]>([]);
    const [errorMessage, setErrorMessage] = useState("");
    const authViewModel = props.authViewModel || new AuthenticationViewModel();

    function getFormItem(name: string): any {
        if (formData.hasOwnProperty(name)) {
            // @ts-ignore
            return formData[name];
        } else {
            return "";
        }
    }

    function addItemButtonClicked(e: SyntheticEvent) {
        e.preventDefault();

        setIsEditing(-1);
        setHasPanelOpen(true);
    }

    function setFormItem(name: string, value: string) {
        setFormData({...formData, [name]: value});
    }

    // Gets all form data from the form ready to submit
    function getFormData(): any {
        const formDataForPost = {};

        for (const key in formData) {
            if (formData.hasOwnProperty(key) && (itemTypes[selectedItemType].fields.hasOwnProperty(key) || key === "name")) {
                // @ts-ignore
                formDataForPost[key] = formData[key];
            }
        }

        return formDataForPost;
    }

    async function editItem(e: SyntheticEvent, id: number) {
        e.preventDefault();

        const item = vaultItems.find(item => item.item_id === id);

        if (item) {
            const type = itemTypes.find(type => type.id === item.type);
            const typeIndex = itemTypes.findIndex(type => type.id === item.type);

            if (type) {
                const formDataForPost = {name: ""};

                formDataForPost.name = item.name;

                for (const subitem in item.subitems) {
                    if (item.subitems.hasOwnProperty(subitem) && (type.fields.hasOwnProperty(item.subitems[subitem].subitem_type))) {
                        // @ts-ignore
                        formDataForPost[item.subitems[subitem].subitem_type] = item.subitems[subitem].subitem_value;
                    }
                }

                setFormData(formDataForPost);
                setSelectedItemType(typeIndex);
                setIsEditing(id);
                setHasPanelOpen(true);
            }
        }
    }

    async function deleteOrCancel(e: SyntheticEvent) {
        e.preventDefault();

        if (isEditing === -1) {
            setHasPanelOpen(false);
            setFormData({});
            setErrorMessage("");
        } else {
            // we need to make a delete request
            const result = await axios.post(process.env.REACT_APP_API_URL + `vault/delete`, {item_id: isEditing});

            if (result.data.success) {
                setVaultItems(vaultItems.filter(item => item.item_id !== isEditing));
                setHasPanelOpen(false);
                setFormData({});
                setErrorMessage("");
            } else {
                setErrorMessage(result.data.message);
            }
        }
    }

    function cancel(e: SyntheticEvent) {
        e.preventDefault();
        setHasPanelOpen(false);
        setFormData({});
        setErrorMessage("")
    }

    async function addItem() {
        if (!authViewModel.isLoggedIn() || !authViewModel.decryptionKey) {
            return;
        }

        const type = itemTypes[selectedItemType].id;
        const {name, ...formDataForPost} = getFormData();

        if (name === "" || name === undefined) {
            setErrorMessage("Please enter a name for this item");
            return;
        }

        if (isEditing !== -1) {
            const itemIndex = vaultItems.findIndex(item => item.item_id === isEditing);
            // existing item
            const subitems = [...vaultItems[itemIndex].subitems];
            const subitemsUnencrypted: SubItem[] = [];
            const itemId = vaultItems[itemIndex].item_id;

            const encryptedName = aesEncryptString(name, authViewModel.decryptionKey);

            for (const subitem in subitems) {
                if (subitems.hasOwnProperty(subitem)) {
                    const subitemValue = subitems[subitem];

                    subitemsUnencrypted[subitem] = {
                        ...subitemValue,
                        subitem_value: formDataForPost[subitemValue.subitem_type]
                    };

                    subitems[subitem] = {
                        ...subitemValue,
                        subitem_value: aesEncryptString(formDataForPost[subitemValue.subitem_type], authViewModel.decryptionKey),
                        subitem_type: aesEncryptString(subitemValue.subitem_type, authViewModel.decryptionKey)
                    };
                }
            }

            const result = await axios.post(process.env.REACT_APP_API_URL + `vault/update`, {
                item_id: itemId,
                name: encryptedName,
                subitems: subitems
            });

            if (result.data.success) {
                setVaultItems(vaultItems.map(item => {
                    if (item.item_id === itemId) {
                        return {
                            ...item,
                            name: name,
                            subitems: subitemsUnencrypted
                        };
                    }

                    return item;
                }));
                setHasPanelOpen(false);
                setFormData({});
                setErrorMessage("");
            } else {
                setErrorMessage(result.data.message);
            }
        } else {
            // New item
            // We need to encrypt all this data into backend format
            const encryptedName = aesEncryptString(name, authViewModel.decryptionKey);

            const encryptedType = aesEncryptString(type, authViewModel.decryptionKey);

            const subitems: SubItem[] = [];

            for (const key in formDataForPost) {
                if (formDataForPost.hasOwnProperty(key)) {
                    const encryptedValue = aesEncryptString(formDataForPost[key], authViewModel.decryptionKey);
                    const encryptedType = aesEncryptString(key, authViewModel.decryptionKey);

                    subitems.push({
                        subitem_type: encryptedType,
                        subitem_value: encryptedValue
                    });
                }
            }


            // backend format
            const encryptedData: Item = {
                name: encryptedName,
                type: encryptedType,
                subitems: subitems,
            };

            const response = await axios.post(process.env.REACT_APP_API_URL + "vault/items", encryptedData);

            if (response.data.success) {
                setHasPanelOpen(false);
                setErrorMessage("");
                setFormData({});

                await getFromBackend();
            } else {
                setErrorMessage(response.data.message);
            }
        }
    }

    let itemTypes: ({ name: string; id: string; fields: any })[];
    itemTypes = [
        {
            id: "account_binance",
            name: "Binance Account",
            fields: {
                email: {
                    type: "email",
                    label: "Email"
                },
                password: {
                    type: "password",
                    label: "Password"
                },
                apiKey: {
                    type: "text",
                    label: "API Key"
                },
                secretKey: {
                    type: "password",
                    label: "Secret Key"
                },
            }
        },
        {
            id: "bank_current_uk",
            name: "UK Current Account",
            fields: {
                account_number: {
                    label: "Account Number",
                    type: "text"
                },
                sort_code: {
                    label: "Sort Code",
                    type: "text"
                },
                account_holder_name: {
                    label: "Account Holder Name",
                    type: "text"
                },
                iban: {
                    label: "IBAN",
                    type: "text"
                },
                bic: {
                    label: "BIC",
                    type: "text"
                },
                bank_name: {
                    label: "Bank Name",
                    type: "text"
                },
            }

        },
        {
            id: "secure_note",
            name: "Note",
            fields: {
                comment: {type: "textarea", label: "Notes"}
            }
        }
    ];

    function getItemTypeIndexById(id: string): number {
        return itemTypes.findIndex(itemType => itemType.id === id);
    }

    async function getFromBackend() {
        let response = await axios.get(process.env.REACT_APP_API_URL + "vault/items");

        const decryptionKey = authViewModel.decryptionKey;

        if (decryptionKey === undefined) return;

        if (response.data.success) {
            const decryptedItems = response.data.data.map((item: Item): Item => {
                return {
                    ...item,
                    name: aesDecryptString(item.name, decryptionKey) || "",
                    type: aesDecryptString(item.type, decryptionKey) || "",
                    subitems: item.subitems.map((subitem: SubItem) => {
                        return {
                            ...subitem,
                            subitem_type: aesDecryptString(subitem.subitem_type, decryptionKey) || "",
                            subitem_value: aesDecryptString(subitem.subitem_value, decryptionKey) || ""
                        }
                    })
                };
            });

            setVaultItems(decryptedItems);
        } else {
            console.log("Failed to get items");
        }
    }

    // Get vault items from backend
    useEffect(() => {
        getFromBackend();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <HomeViewModel
        getFormItem={getFormItem} delete={deleteOrCancel} editItem={editItem} cancel={cancel} errorMessage={errorMessage} setFormItem={setFormItem} submitForm={addItem} hasPanelOpen={hasPanelOpen}
        selectedItemType={selectedItemType} setSelectedItemType={setSelectedItemType} addItemButtonClicked={addItemButtonClicked}
        vaultItems={vaultItems} vaultItemTypes={itemTypes} isEditing={isEditing} getItemTypeIndexById={getItemTypeIndexById} setIsEditing={setIsEditing} />;
};