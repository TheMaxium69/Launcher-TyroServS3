// Fichier de mémo pour quand je déveloperrais le mod

        try {
            File myObj = new File("usercachetyroserv.json");
            Scanner myReader = new Scanner(myObj);
            while (myReader.hasNextLine()) {
                String data = myReader.nextLine();
                System.out.println(data);
            }
            myReader.close();

            Path path = Paths.get("usercachetyroserv.json");
            Files.delete(path);
        } catch (FileNotFoundException e) {
            System.out.println("An error occurred.");
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        }