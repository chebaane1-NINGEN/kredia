import com.hedera.hashgraph.sdk.PrivateKey;
public class TestDer {
    public static void main(String[] args) {
        String k = "3030020100300706052b8104000a042204203994d70e9a219da57beb417414219f23eb82feefe052d83e5c70ff6b6c5989ec";
        try {
            PrivateKey pk = PrivateKey.fromStringECDSA(k);
            System.out.println("ECDSA: " + pk.toString());
        } catch (Exception e) {
            e.printStackTrace();
        }
        try {
            PrivateKey pk2 = PrivateKey.fromString(k);
            System.out.println("Default: " + pk2.toString());
        } catch (Exception e) {
             e.printStackTrace();
        }
    }
}
