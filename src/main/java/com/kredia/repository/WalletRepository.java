package com.kredia.repository;
import com.kredia.entity.wallet.Wallet;
import org.springframework.data.jpa.repository.JpaRepository;
public interface WalletRepository extends JpaRepository<Wallet, Long> {

}
